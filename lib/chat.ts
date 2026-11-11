import { OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, isPrismaErrorCode } from "@/lib/http";
import type { SendMessageInput, StartConversationInput } from "@/types/schemas/chat";

const CLOSED_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED_EXPIRED,
  OrderStatus.REJECTED_BY_CUSTOMER,
  OrderStatus.REJECTED_BY_DRIVER,
  OrderStatus.REFUNDED,
]);

const SUMMARY_INCLUDE = {
  customer: { select: { id: true, name: true } },
  driver: { select: { id: true, user: { select: { id: true, name: true } } } },
  trip: {
    select: {
      id: true,
      serviceType: true,
      originCity: true,
      destCity: true,
      departureAt: true,
    },
  },
  order: { select: { id: true, status: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, senderId: true, body: true, createdAt: true },
  },
} satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof SUMMARY_INCLUDE }>;

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  createdAt: true,
  sender: { select: { id: true, name: true } },
} satisfies Prisma.MessageSelect;

function serializeConversation(row: ConversationRow) {
  return {
    id: row.id,
    customerId: row.customerId,
    driverId: row.driverId,
    tripId: row.tripId,
    orderId: row.orderId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customer: row.customer,
    driver: row.driver,
    trip: row.trip,
    order: row.order,
    lastMessage: row.messages[0] ?? null,
  };
}

async function findConversationForUser(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ customerId: userId }, { driver: { userId } }],
    },
    include: SUMMARY_INCLUDE,
  });
  if (!conversation) {
    throw new AppError(404, "NOT_FOUND", "Percakapan tidak ditemukan");
  }
  return conversation;
}

async function findCustomerDriverConversation(customerId: string, driverId: string) {
  return prisma.conversation.findUnique({
    where: { customerId_driverId: { customerId, driverId } },
    include: SUMMARY_INCLUDE,
  });
}

async function updateConversationContext(
  conversationId: string,
  data: { tripId: string | null; orderId: string | null }
) {
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data,
    include: SUMMARY_INCLUDE,
  });
  return serializeConversation(updated);
}

async function createConversation(data: {
  customerId: string;
  driverId: string;
  tripId: string | null;
  orderId: string | null;
}) {
  const created = await prisma.conversation.create({
    data,
    include: SUMMARY_INCLUDE,
  });
  return serializeConversation(created);
}

export async function startConversation(
  user: { id: string; role: Role },
  input: StartConversationInput
) {
  if (input.tripId) {
    if (user.role !== Role.CUSTOMER) {
      throw new AppError(403, "FORBIDDEN", "Hanya customer yang dapat memulai chat dari trip");
    }
    const trip = await prisma.tripListing.findUnique({
      where: { id: input.tripId },
      select: { id: true, driverId: true },
    });
    if (!trip) {
      throw new AppError(404, "NOT_FOUND", "Trip tidak ditemukan");
    }
    const existing = await findCustomerDriverConversation(user.id, trip.driverId);
    if (existing) {
      if (existing.tripId === trip.id) return serializeConversation(existing);
      return updateConversationContext(existing.id, { tripId: trip.id, orderId: null });
    }
    try {
      return await createConversation({
        customerId: user.id,
        driverId: trip.driverId,
        tripId: trip.id,
        orderId: null,
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) {
        const raced = await findCustomerDriverConversation(user.id, trip.driverId);
        if (raced) return updateConversationContext(raced.id, { tripId: trip.id, orderId: null });
      }
      throw error;
    }
  }

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      OR: [{ customerId: user.id }, { driver: { userId: user.id } }],
    },
    select: {
      id: true,
      customerId: true,
      driverId: true,
      tripId: true,
      status: true,
    },
  });
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
  }

  const existing = await findCustomerDriverConversation(order.customerId, order.driverId);
  if (existing) {
    if (existing.orderId === order.id) return serializeConversation(existing);
    return updateConversationContext(existing.id, {
      tripId: order.tripId,
      orderId: order.id,
    });
  }

  try {
    return await createConversation({
      customerId: order.customerId,
      driverId: order.driverId,
      tripId: order.tripId,
      orderId: order.id,
    });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      const raced = await findCustomerDriverConversation(order.customerId, order.driverId);
      if (raced) {
        if (raced.orderId === order.id) return serializeConversation(raced);
        return updateConversationContext(raced.id, {
          tripId: order.tripId,
          orderId: order.id,
        });
      }
    }
    throw error;
  }
}

export async function listConversations(userId: string) {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ customerId: userId }, { driver: { userId } }] },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 50,
    include: SUMMARY_INCLUDE,
  });
  return { items: rows.map(serializeConversation) };
}

export async function listMessages(userId: string, conversationId: string, limit: number) {
  await findConversationForUser(userId, conversationId);
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: MESSAGE_SELECT,
  });
  return { items: rows.reverse() };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  input: SendMessageInput
) {
  const conversation = await findConversationForUser(userId, conversationId);
  if (conversation.order && CLOSED_ORDER_STATUSES.has(conversation.order.status)) {
    throw new AppError(409, "CHAT_CLOSED", "Percakapan sudah ditutup karena pesanan selesai");
  }
  const body = input.body.trim();
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderId: userId, body },
      select: MESSAGE_SELECT,
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });
  return message;
}
