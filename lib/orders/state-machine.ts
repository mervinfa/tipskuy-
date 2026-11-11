import { OrderStatus as S, ActorType, Prisma } from "@prisma/client";
import { AppError } from "@/lib/http";

type Actor = ActorType;

export const TRANSITIONS: Record<S, Partial<Record<S, Actor[]>>> = {
  DRAFT: { WAITING_DRIVER_PRICING: ["CUSTOMER"] },
  WAITING_DRIVER_PRICING: {
    WAITING_CUSTOMER_PAYMENT: ["DRIVER"],
    REJECTED_BY_DRIVER: ["DRIVER"],
    REJECTED_BY_CUSTOMER: ["CUSTOMER"],
  },
  WAITING_CUSTOMER_PAYMENT: {
    PAID_HELD_IN_ESCROW: ["SYSTEM"],
    CANCELLED_EXPIRED: ["SYSTEM"],
    REJECTED_BY_CUSTOMER: ["CUSTOMER"],
  },
  PAID_HELD_IN_ESCROW: { IN_TRANSIT: ["DRIVER"], DISPUTED: ["CUSTOMER", "DRIVER"] },
  IN_TRANSIT: { DELIVERED_PENDING_CONFIRMATION: ["DRIVER"], DISPUTED: ["CUSTOMER", "DRIVER"] },
  DELIVERED_PENDING_CONFIRMATION: { COMPLETED: ["CUSTOMER"], DISPUTED: ["CUSTOMER"] },
  DISPUTED: { COMPLETED: ["ADMIN"], REFUNDED: ["ADMIN"] },
  COMPLETED: {},
  CANCELLED_EXPIRED: {},
  REJECTED_BY_CUSTOMER: {},
  REJECTED_BY_DRIVER: {},
  REFUNDED: {},
};

export function assertTransition(from: S, to: S, actor: Actor) {
  const allowed = TRANSITIONS[from]?.[to];
  if (!allowed || !allowed.includes(actor)) {
    throw new AppError(409, "INVALID_TRANSITION", `Transisi ${from} -> ${to} oleh ${actor} tidak diizinkan`);
  }
}

type TransitionInput = {
  orderId: string;
  from: S;
  to: S;
  actor: { type: Actor; id?: string };
  data?: Prisma.OrderUpdateManyMutationInput;
  extraWhere?: Prisma.OrderWhereInput;
  reason?: string;
};

// Update bersyarat pada updateMany bertindak sebagai kunci: dua request bersamaan
// untuk order yang sama, hanya satu yang mendapat count === 1.
export async function transition(tx: Prisma.TransactionClient, i: TransitionInput) {
  assertTransition(i.from, i.to, i.actor.type);
  const res = await tx.order.updateMany({
    where: { id: i.orderId, status: i.from, ...i.extraWhere },
    data: { status: i.to, ...i.data },
  });
  if (res.count !== 1) {
    throw new AppError(409, "ORDER_STATE_CONFLICT", "Status order sudah berubah atau syarat transisi tidak terpenuhi");
  }
  await tx.orderStatusLog.create({
    data: {
      orderId: i.orderId,
      fromStatus: i.from,
      toStatus: i.to,
      actorType: i.actor.type,
      actorId: i.actor.id,
      reason: i.reason,
    },
  });
}
