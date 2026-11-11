import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import { computeMockSignature } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { GET as listOrdersRoute, POST as createOrderRoute } from "@/app/api/orders/route";
import { GET as orderDetailRoute } from "@/app/api/orders/[id]/route";
import { PATCH as setPriceRoute } from "@/app/api/orders/[id]/set-price/route";
import { POST as createTripRoute } from "@/app/api/trips/route";
import { POST as uploadRoute } from "@/app/api/uploads/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { GET as meRoute } from "@/app/api/me/route";
import { GET as notificationsRoute } from "@/app/api/notifications/route";
import { PATCH as readNotificationRoute } from "@/app/api/notifications/[id]/read/route";
import { PATCH as readAllNotificationsRoute } from "@/app/api/notifications/read-all/route";
import { POST as withdrawRoute } from "@/app/api/wallet/withdraw/route";
import { GET as cronRoute } from "@/app/api/cron/expire-orders/route";
import { POST as webhookRoute } from "@/app/api/payments/webhook/route";
import { POST as expireOrderJobRoute } from "@/app/api/jobs/expire-order/route";
import { orderStatus, uniqueEmail } from "./helpers";
import { createPricedOrder, createUnpricedOrder, createUser } from "./helpers";

// Uji route handler secara langsung. Sesi dikendalikan lewat mock fungsi auth
// dari lib/auth; seluruh fungsi lain (registerUser dan sebagainya) tetap asli.
const authMock = vi.hoisted(() => vi.fn<() => Promise<Session | null>>());

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  auth: authMock,
}));

function mockSession(user: { id: string; email: string } | null, role: "CUSTOMER" | "DRIVER" = "CUSTOMER") {
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

function jsonRequest(url: string, method: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function errorBody(res: Response) {
  return (await res.json()) as { error: { code: string } };
}

beforeEach(() => {
  authMock.mockReset();
});

describe("Proteksi sesi dan peran (E-20, E-08, E-09)", () => {
  it("E-20 tanpa sesi menolak endpoint terproteksi dengan 401", async () => {
    mockSession(null);
    const resOrder = await orderDetailRoute(
      new Request("http://localhost:3000/api/orders/clorder1"),
      ctx("clorder1")
    );
    expect(resOrder.status).toBe(401);
    expect((await errorBody(resOrder)).error.code).toBe("UNAUTHENTICATED");

    const resTrip = await createTripRoute(
      jsonRequest("http://localhost:3000/api/trips", "POST", {}),
      { params: Promise.resolve({}) }
    );
    expect(resTrip.status).toBe(401);
  });

  it("E-08 CUSTOMER tidak boleh membuat trip", async () => {
    const customer = await createUser("CUSTOMER");
    mockSession(customer);
    const res = await createTripRoute(
      jsonRequest("http://localhost:3000/api/trips", "POST", {}),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(403);
    expect((await errorBody(res)).error.code).toBe("FORBIDDEN");
  });

  it("E-09 upload dengan purpose yang tidak cocok peran ditolak 403", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");

    mockSession(customer);
    const formProof = new FormData();
    formProof.set("purpose", "PROOF");
    formProof.set("file", new File(["data"], "bukti.webp", { type: "image/webp" }));
    const resProof = await uploadRoute(
      new Request("http://localhost:3000/api/uploads", { method: "POST", body: formProof }),
      { params: Promise.resolve({}) }
    );
    expect(resProof.status).toBe(403);
    expect((await errorBody(resProof)).error.code).toBe("FORBIDDEN");

    mockSession(driver, "DRIVER");
    const formItem = new FormData();
    formItem.set("purpose", "ITEM");
    formItem.set("file", new File(["data"], "barang.webp", { type: "image/webp" }));
    const resItem = await uploadRoute(
      new Request("http://localhost:3000/api/uploads", { method: "POST", body: formItem }),
      { params: Promise.resolve({}) }
    );
    expect(resItem.status).toBe(403);
  });
});

describe("Validasi body route (E-16, E-12, E-05)", () => {
  it("E-16 set-price menolak field asing status, totalAmount, dan driverId", async () => {
    const fixture = await createUnpricedOrder();
    mockSession(fixture.driver, "DRIVER");
    const itemId = fixture.itemIds[0];
    for (const field of ["status", "totalAmount", "driverId"]) {
      const body = {
        items: [{ id: itemId, finalPrice: 50_000 }],
        serviceFee: 25_000,
        [field]: "nilai-asing",
      };
      const res = await setPriceRoute(
        jsonRequest(
          `http://localhost:3000/api/orders/${fixture.orderId}/set-price`,
          "PATCH",
          body
        ),
        ctx(fixture.orderId)
      );
      expect(res.status).toBe(422);
      expect((await errorBody(res)).error.code).toBe("VALIDATION_ERROR");
    }
    expect(await orderStatus(fixture.orderId)).toBe("WAITING_DRIVER_PRICING");
  });

  it("E-12 set-price menolak finalPrice negatif atau pecahan melalui route", async () => {
    const fixture = await createUnpricedOrder();
    mockSession(fixture.driver, "DRIVER");
    const itemId = fixture.itemIds[0];
    for (const finalPrice of [-1, 1_500.5]) {
      const res = await setPriceRoute(
        jsonRequest(
          `http://localhost:3000/api/orders/${fixture.orderId}/set-price`,
          "PATCH",
          { items: [{ id: itemId, finalPrice }], serviceFee: 25_000 }
        ),
        ctx(fixture.orderId)
      );
      expect(res.status).toBe(422);
      expect((await errorBody(res)).error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("driver boleh membuka trip dengan kota asal dan tujuan sama", async () => {
    const driver = await createUser("DRIVER");
    mockSession(driver, "DRIVER");
    const res = await createTripRoute(
      jsonRequest("http://localhost:3000/api/trips", "POST", {
        serviceType: "JASTIP",
        origin: { cityCode: "3374" },
        destination: { cityCode: "3374" },
        baseFee: 15_000,
      }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      data: { originCity: string; destCity: string; originCityCode: string; destCityCode: string };
    };
    expect(json.data.originCityCode).toBe("3374");
    expect(json.data.destCityCode).toBe("3374");
    expect(json.data.originCity).toBe("Kota Semarang");
    expect(json.data.destCity).toBe("Kota Semarang");
  });

  it("E-05 withdraw tidak menerima field saldo dari client", async () => {
    const driver = await createUser("DRIVER");
    mockSession(driver, "DRIVER");
    const res = await withdrawRoute(
      jsonRequest("http://localhost:3000/api/wallet/withdraw", "POST", {
        amount: 10_000,
        bankCode: "BCA",
        accountNumber: "12345678",
        balance: 999_999_999,
      }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(422);
    expect((await errorBody(res)).error.code).toBe("VALIDATION_ERROR");
  });

  it("withdraw valid mengurangi saldo melalui route", async () => {
    const driver = await createUser("DRIVER");
    await prisma.wallet.update({ where: { userId: driver.id }, data: { balance: 50_000 } });
    mockSession(driver, "DRIVER");
    const res = await withdrawRoute(
      jsonRequest("http://localhost:3000/api/wallet/withdraw", "POST", {
        amount: 10_000,
        bankCode: "BCA",
        accountNumber: "12345678",
      }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { balance: number } };
    expect(json.data.balance).toBe(40_000);
  });
});

describe("Route register (rate limit dan email duplikat)", () => {
  it("menerima 5 panggilan pertama lalu menolak panggilan ke-6 dengan 429", async () => {
    const ip = "10.77.0.1";
    const buat = (email: string) =>
      registerRoute(
        jsonRequest(
          "http://localhost:3000/api/auth/register",
          "POST",
          {
            name: "Pendaftar Uji",
            email,
            password: "sandi12345",
            phone: "081234567890",
            role: "CUSTOMER",
          },
          { "x-forwarded-for": ip }
        ),
        { params: Promise.resolve({}) }
      );

    const sukses = await buat(uniqueEmail("route-reg"));
    expect(sukses.status).toBe(201);

    const pertama = await buat("duplikat-reg@example.test");
    expect(pertama.status).toBe(201);

    const duplikat = await buat("duplikat-reg@example.test");
    expect(duplikat.status).toBe(409);
    expect((await errorBody(duplikat)).error.code).toBe("EMAIL_TAKEN");

    for (let i = 0; i < 2; i += 1) {
      const res = await buat(uniqueEmail("route-reg"));
      expect(res.status).toBe(201);
    }

    const keenam = await buat(uniqueEmail("route-reg"));
    expect(keenam.status).toBe(429);
    expect((await errorBody(keenam)).error.code).toBe("RATE_LIMITED");
  });
});

describe("Route order dan notifikasi", () => {
  it("GET order detail mengembalikan data dan serverTime", async () => {
    const fixture = await createPricedOrder();
    mockSession(fixture.customer);
    const res = await orderDetailRoute(
      new Request(`http://localhost:3000/api/orders/${fixture.orderId}`),
      ctx(fixture.orderId)
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { id: string; status: string; serverTime: string };
    };
    expect(json.data.id).toBe(fixture.orderId);
    expect(json.data.status).toBe("WAITING_CUSTOMER_PAYMENT");
    expect(json.data.serverTime).toBeTruthy();
  });

  it("E-06 customer lain membaca order milik orang lain mendapat 404", async () => {
    const fixture = await createPricedOrder();
    const customerLain = await createUser("CUSTOMER");
    mockSession(customerLain);
    const res = await orderDetailRoute(
      new Request(`http://localhost:3000/api/orders/${fixture.orderId}`),
      ctx(fixture.orderId)
    );
    expect(res.status).toBe(404);
    expect((await errorBody(res)).error.code).toBe("NOT_FOUND");
  });

  it("GET daftar order mengembalikan item milik user dan serverTime", async () => {
    const fixture = await createPricedOrder();
    mockSession(fixture.customer);
    const res = await listOrdersRoute(
      new Request("http://localhost:3000/api/orders?role=customer&limit=20"),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { items: { id: string }[]; serverTime: string };
    };
    expect(json.data.items.some((item) => item.id === fixture.orderId)).toBe(true);
    expect(json.data.serverTime).toBeTruthy();
  });

  it("POST order membuat order baru milik customer bersesi", async () => {
    const fixture = await createUnpricedOrder();
    const customer = await createUser("CUSTOMER");
    mockSession(customer);
    const res = await createOrderRoute(
      jsonRequest("http://localhost:3000/api/orders", "POST", {
        tripId: fixture.tripId,
        items: [
          {
            name: "Barang Route",
            imageUrl: `http://localhost:3000/uploads/order-items/${customer.id}/2026/11/barang.webp`,
            quantity: 1,
            estimatedPrice: 20_000,
          },
        ],
      }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { id: string; serverTime: string } };
    expect(json.data.id).toBeTruthy();
    expect(json.data.serverTime).toBeTruthy();
  });

  it("I-11 GET notifications memicu lazy expiry order yang hangus", async () => {
    const fixture = await createPricedOrder({
      pricedAt: new Date(Date.now() - 400_000),
    });
    mockSession(fixture.customer);
    const res = await notificationsRoute(
      new Request("http://localhost:3000/api/notifications?limit=20"),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { unreadCount: number; serverTime: string };
    };
    expect(json.data.unreadCount).toBeGreaterThanOrEqual(1);
    expect(json.data.serverTime).toBeTruthy();
    expect(await orderStatus(fixture.orderId)).toBe("CANCELLED_EXPIRED");
  });

  it("PATCH notification read menandai terbaca dan menolak milik orang lain", async () => {
    const customer = await createUser("CUSTOMER");
    const customerLain = await createUser("CUSTOMER");
    const notif = await prisma.notification.create({
      data: {
        userId: customer.id,
        type: "PRICE_SET",
        title: "Harga sudah ditentukan",
        body: "Total Rp81.250.",
      },
    });

    mockSession(customer);
    const res = await readNotificationRoute(
      new Request(`http://localhost:3000/api/notifications/${notif.id}/read`, { method: "PATCH" }),
      ctx(notif.id)
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { id: string; readAt: string } };
    expect(json.data.id).toBe(notif.id);
    expect(json.data.readAt).toBeTruthy();

    // Panggilan kedua idempoten: readAt tidak berubah.
    const resUlang = await readNotificationRoute(
      new Request(`http://localhost:3000/api/notifications/${notif.id}/read`, { method: "PATCH" }),
      ctx(notif.id)
    );
    expect(resUlang.status).toBe(200);
    const jsonUlang = (await resUlang.json()) as { data: { readAt: string } };
    expect(jsonUlang.data.readAt).toBe(json.data.readAt);

    const notifLain = await prisma.notification.create({
      data: {
        userId: customerLain.id,
        type: "PRICE_SET",
        title: "Harga sudah ditentukan",
        body: "Total Rp81.250.",
      },
    });
    mockSession(customer);
    const resLain = await readNotificationRoute(
      new Request(`http://localhost:3000/api/notifications/${notifLain.id}/read`, {
        method: "PATCH",
      }),
      ctx(notifLain.id)
    );
    expect(resLain.status).toBe(404);
  });

  it("PATCH read-all menandai seluruh notifikasi terbaca", async () => {
    const fixture = await createPricedOrder();
    mockSession(fixture.customer);
    const res = await readAllNotificationsRoute(
      new Request("http://localhost:3000/api/notifications/read-all", { method: "PATCH" }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { updatedCount: number; serverTime: string } };
    expect(json.data.updatedCount).toBeGreaterThanOrEqual(1);
    expect(json.data.serverTime).toBeTruthy();
  });

  it("GET me mengembalikan profil pengguna bersesi", async () => {
    const driver = await createUser("DRIVER");
    mockSession(driver, "DRIVER");
    const res = await meRoute(new Request("http://localhost:3000/api/me"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { id: string; role: string } };
    expect(json.data.id).toBe(driver.id);
    expect(json.data.role).toBe("DRIVER");
  });
});

describe("Route internal (cron, job, webhook)", () => {
  it("cron tanpa secret ditolak dan dengan secret diterima", async () => {
    const tolak = await cronRoute(new Request("http://localhost:3000/api/cron/expire-orders"), {
      params: Promise.resolve({}),
    });
    expect(tolak.status).toBe(401);

    const terima = await cronRoute(
      new Request("http://localhost:3000/api/cron/expire-orders", {
        headers: { authorization: "Bearer cron-testing-secret" },
      }),
      { params: Promise.resolve({}) }
    );
    expect(terima.status).toBe(200);
    const json = (await terima.json()) as { data: { expired: number } };
    expect(json.data.expired).toBeGreaterThanOrEqual(0);
  });

  it("webhook tanpa signature ditolak dan signature valid diproses", async () => {
    const body = JSON.stringify({ gatewayRef: "gw-route-tak-ada", status: "PAID" });
    const tolak = await webhookRoute(
      new Request("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
      { params: Promise.resolve({}) }
    );
    expect(tolak.status).toBe(401);

    const proses = await webhookRoute(
      new Request("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mock-signature": computeMockSignature(body),
        },
        body,
      }),
      { params: Promise.resolve({}) }
    );
    // Signature valid tetapi gatewayRef tak dikenal: ditolak 404.
    expect(proses.status).toBe(404);
  });

  it("job expire-order tanpa signature ditolak dan signature valid diproses", async () => {
    const body = JSON.stringify({ orderId: "id-order-tak-ada" });
    const tolak = await expireOrderJobRoute(
      new Request("http://localhost:3000/api/jobs/expire-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
      { params: Promise.resolve({}) }
    );
    expect(tolak.status).toBe(401);

    const proses = await expireOrderJobRoute(
      new Request("http://localhost:3000/api/jobs/expire-order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mock-signature": computeMockSignature(body),
        },
        body,
      }),
      { params: Promise.resolve({}) }
    );
    expect(proses.status).toBe(200);
    const json = (await proses.json()) as { data: { orderId: string; expired: boolean } };
    expect(json.data.orderId).toBe("id-order-tak-ada");
    expect(json.data.expired).toBe(false);
  });
});
