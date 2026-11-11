import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET as listConversationsRoute, POST as startConversationRoute } from "@/app/api/conversations/route";
import { GET as listMessagesRoute, POST as sendMessageRoute } from "@/app/api/conversations/[id]/messages/route";
import { createTripFixture, createUnpricedOrder, createUser } from "./helpers";

const authMock = vi.hoisted(() => vi.fn<() => Promise<Session | null>>());

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  auth: authMock,
}));

function mockSession(
  user: { id: string; email: string } | null,
  role: "CUSTOMER" | "DRIVER" = "CUSTOMER"
) {
  authMock.mockResolvedValue(
    user
      ? ({
          user: { id: user.id, name: "Pengguna Uji", email: user.email, role },
          expires: "2027-01-01T00:00:00.000Z",
        } as Session)
      : null
  );
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

type Envelope<T> = { data: T };

beforeEach(() => {
  authMock.mockReset();
});

describe("Chat customer dan driver", () => {
  it("customer memulai chat dari trip, driver melihat dan membalas", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const tripId = await createTripFixture(driver.driverProfileId);

    mockSession(customer);
    const startRes = await startConversationRoute(
      jsonRequest("http://localhost:3000/api/conversations", "POST", { tripId }),
      { params: Promise.resolve({}) }
    );
    expect(startRes.status).toBe(200);
    const started = (await startRes.json()) as Envelope<{ id: string; tripId: string }>;
    expect(started.data.tripId).toBe(tripId);

    const againRes = await startConversationRoute(
      jsonRequest("http://localhost:3000/api/conversations", "POST", { tripId }),
      { params: Promise.resolve({}) }
    );
    const again = (await againRes.json()) as Envelope<{ id: string }>;
    expect(again.data.id).toBe(started.data.id);

    mockSession(driver, "DRIVER");
    const listRes = await listConversationsRoute(
      new Request("http://localhost:3000/api/conversations"),
      { params: Promise.resolve({}) }
    );
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Envelope<{ items: { id: string }[] }>;
    expect(list.data.items.map((item) => item.id)).toContain(started.data.id);

    mockSession(customer);
    const sendRes = await sendMessageRoute(
      jsonRequest(`http://localhost:3000/api/conversations/${started.data.id}/messages`, "POST", {
        body: "Halo driver, bisa titip hari ini?",
      }),
      ctx(started.data.id)
    );
    expect(sendRes.status).toBe(201);

    mockSession(driver, "DRIVER");
    const messagesRes = await listMessagesRoute(
      new Request(`http://localhost:3000/api/conversations/${started.data.id}/messages`),
      ctx(started.data.id)
    );
    const messages = (await messagesRes.json()) as Envelope<{
      items: { body: string; senderId: string }[];
    }>;
    expect(messages.data.items).toHaveLength(1);
    expect(messages.data.items[0].body).toBe("Halo driver, bisa titip hari ini?");
    expect(messages.data.items[0].senderId).toBe(customer.id);
  });

  it("pengguna di luar percakapan tidak dapat membaca pesan", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const outsider = await createUser("CUSTOMER");
    const tripId = await createTripFixture(driver.driverProfileId);

    mockSession(customer);
    const startRes = await startConversationRoute(
      jsonRequest("http://localhost:3000/api/conversations", "POST", { tripId }),
      { params: Promise.resolve({}) }
    );
    const started = (await startRes.json()) as Envelope<{ id: string }>;

    mockSession(outsider);
    const res = await listMessagesRoute(
      new Request(`http://localhost:3000/api/conversations/${started.data.id}/messages`),
      ctx(started.data.id)
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("driver tidak dapat memulai chat dari trip", async () => {
    const driver = await createUser("DRIVER");
    const tripId = await createTripFixture(driver.driverProfileId);

    mockSession(driver, "DRIVER");
    const res = await startConversationRoute(
      jsonRequest("http://localhost:3000/api/conversations", "POST", { tripId }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("chat dari order yang sudah selesai bersifat baca saja", async () => {
    const fixture = await createUnpricedOrder();

    mockSession(fixture.customer);
    const startRes = await startConversationRoute(
      jsonRequest("http://localhost:3000/api/conversations", "POST", { orderId: fixture.orderId }),
      { params: Promise.resolve({}) }
    );
    const started = (await startRes.json()) as Envelope<{ id: string }>;

    await prisma.order.update({
      where: { id: fixture.orderId },
      data: { status: "COMPLETED", closedAt: new Date(), closeReason: "Selesai" },
    });

    const res = await sendMessageRoute(
      jsonRequest(`http://localhost:3000/api/conversations/${started.data.id}/messages`, "POST", {
        body: "Pesan setelah selesai",
      }),
      ctx(started.data.id)
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("CHAT_CLOSED");
  });
});
