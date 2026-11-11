import { describe, expect, it } from "vitest";
import { ActorType, OpenRequestStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOpenRequest, listOpenRequests } from "@/lib/open-requests";
import { claimOpenRequest } from "@/lib/orders/service";
import { expectAppError } from "./helpers";
import { createUser, itemImageUrl } from "./helpers";

const HARI_MS = 24 * 60 * 60 * 1000;

function baseInput(imageUrl?: string) {
  return {
    serviceType: "JASTIP" as const,
    originCityCode: "3374",
    destCityCode: "3273",
    description: "Titipkan dokumen ke Bandung",
    imageUrl,
  };
}

describe("Postingan terbuka (open request)", () => {
  it("membuat postingan dengan masa berlaku 7 hari", async () => {
    const customer = await createUser("CUSTOMER");
    const clock = new Date("2026-11-01T08:00:00.000Z");
    const created = await createOpenRequest(customer.id, baseInput(itemImageUrl(customer.id)), clock);
    expect(created.status).toBe(OpenRequestStatus.OPEN);
    expect(created.originCity).toBe("Kota Semarang");
    expect(created.destCity).toBe("Kota Bandung");
    expect(created.expiresAt.getTime() - clock.getTime()).toBe(7 * HARI_MS);
  });

  it("menolak kode kota yang tidak dikenali", async () => {
    const customer = await createUser("CUSTOMER");
    await expectAppError(
      createOpenRequest(customer.id, { ...baseInput(), originCityCode: "9999" }),
      422,
      "INVALID_CITY_CODE"
    );
  });

  it("menolak imageUrl dari host lain", async () => {
    const customer = await createUser("CUSTOMER");
    const urlLain = `https://host-lain.example.com/uploads/order-items/${customer.id}/2026/11/barang.webp`;
    await expectAppError(
      createOpenRequest(customer.id, baseInput(urlLain)),
      422,
      "INVALID_IMAGE_URL"
    );
  });

  it("driver mengklaim postingan dan order lahir di WAITING_DRIVER_PRICING", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const request = await createOpenRequest(customer.id, baseInput(itemImageUrl(customer.id)));

    const order = await claimOpenRequest(driver.id, request.id);
    expect(order.status).toBe(OrderStatus.WAITING_DRIVER_PRICING);
    expect(order.openRequestId).toBe(request.id);
    expect(order.driver.id).toBe(driver.driverProfileId);

    const row = await prisma.openRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row.status).toBe(OpenRequestStatus.CLAIMED);

    // Log baris pertama dicatat dengan fromStatus null karena order tidak
    // melalui DRAFT (lihat komentar pada claimOpenRequest).
    const logs = await prisma.orderStatusLog.findMany({ where: { orderId: order.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.fromStatus).toBeNull();
    expect(logs[0]?.toStatus).toBe(OrderStatus.WAITING_DRIVER_PRICING);
    expect(logs[0]?.actorType).toBe(ActorType.DRIVER);

    const notif = await prisma.notification.findFirst({
      where: { userId: customer.id, orderId: order.id, type: "OPEN_REQUEST_CLAIMED" },
    });
    expect(notif).not.toBeNull();
  });

  it("menolak klaim kedua atas postingan yang sudah diklaim", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const driverLain = await createUser("DRIVER");
    const request = await createOpenRequest(customer.id, baseInput());
    await claimOpenRequest(driver.id, request.id);
    await expectAppError(claimOpenRequest(driverLain.id, request.id), 409, "OPEN_REQUEST_UNAVAILABLE");
  });

  it("menolak klaim oleh customer tanpa profil driver", async () => {
    const customer = await createUser("CUSTOMER");
    const customerLain = await createUser("CUSTOMER");
    const request = await createOpenRequest(customer.id, baseInput());
    await expectAppError(claimOpenRequest(customerLain.id, request.id), 409, "DRIVER_PROFILE_MISSING");
    expect((await prisma.openRequest.findUniqueOrThrow({ where: { id: request.id } })).status).toBe(
      OpenRequestStatus.OPEN
    );
  });

  it("menolak klaim atas postingan yang sudah kedaluwarsa", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const clockLama = new Date(Date.now() - 8 * HARI_MS);
    const request = await createOpenRequest(customer.id, baseInput(), clockLama);
    await expectAppError(claimOpenRequest(driver.id, request.id), 409, "OPEN_REQUEST_UNAVAILABLE");
  });

  it("listOpenRequests hanya menampilkan yang OPEN dan belum kedaluwarsa", async () => {
    const customer = await createUser("CUSTOMER");
    const driver = await createUser("DRIVER");
    const aktif = await createOpenRequest(customer.id, baseInput());
    const diklaim = await createOpenRequest(customer.id, baseInput());
    const kedaluwarsa = await createOpenRequest(
      customer.id,
      baseInput(),
      new Date(Date.now() - 8 * HARI_MS)
    );
    await claimOpenRequest(driver.id, diklaim.id);

    const result = await listOpenRequests({ page: 1, pageSize: 100 });
    const ids = result.items.map((item) => item.id);
    expect(ids).toContain(aktif.id);
    expect(ids).not.toContain(diklaim.id);
    expect(ids).not.toContain(kedaluwarsa.id);

    const terfilter = await listOpenRequests({ page: 1, pageSize: 100, destCityCode: "3273" });
    expect(terfilter.items.map((item) => item.id)).toContain(aktif.id);
  });
});
