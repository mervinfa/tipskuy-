import { createOrder, payOrder, setPrice } from "@/lib/orders/service";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import { expect } from "vitest";

// Asersi bersama untuk galat domain yang dilempar sebagai AppError.
export async function expectAppError(promise: Promise<unknown>, status: number, code: string): Promise<void> {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    const err = e as AppError;
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    return;
  }
  expect.unreachable(`Seharusnya melempar AppError ${code}`);
}

const runId = crypto.randomUUID().slice(0, 8);
let counter = 0;

export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${runId}-${counter}@test.tipskuy`;
}

export type CustomerFixture = { id: string; email: string };
export type DriverFixture = { id: string; email: string; driverProfileId: string };

export async function createUser(role: "DRIVER"): Promise<DriverFixture>;
export async function createUser(role: "CUSTOMER"): Promise<CustomerFixture>;
export async function createUser(role: "CUSTOMER" | "DRIVER"): Promise<CustomerFixture | DriverFixture> {
  const email = uniqueEmail(role.toLowerCase());
  const user = await prisma.user.create({
    data: {
      name: "Pengguna Uji",
      email,
      passwordHash: "bukan-hash-untuk-uji-langsung",
      phone: "081234567890",
      role,
    },
  });
  await prisma.wallet.create({ data: { userId: user.id } });
  if (role === "DRIVER") {
    const profile = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        vehicleType: "Motor",
        vehiclePlate: `B ${runId.toUpperCase()} ${counter} UJ`,
        whatsappNumber: "6281234567890",
        verificationStatus: "VERIFIED",
      },
    });
    return { id: user.id, email, driverProfileId: profile.id };
  }
  return { id: user.id, email };
}

export async function createTripFixture(driverProfileId: string, baseFee = 10_000): Promise<string> {
  const trip = await prisma.tripListing.create({
    data: {
      driverId: driverProfileId,
      serviceType: "JASTIP",
      originProvince: "Jawa Tengah",
      originCityCode: "3374",
      originCity: "Kota Semarang",
      originLat: -6.9667,
      originLng: 110.4167,
      destProvince: "Jawa Barat",
      destCityCode: "3273",
      destCity: "Kota Bandung",
      destLat: -6.9175,
      destLng: 107.6191,
      baseFee,
    },
  });
  return trip.id;
}

export function itemImageUrl(userId: string, name = "barang.webp"): string {
  return `http://localhost:3000/uploads/order-items/${userId}/2026/11/${name}`;
}

export function proofImageUrl(userId: string, name = "bukti.webp"): string {
  return `http://localhost:3000/uploads/delivery-proofs/${userId}/2026/11/${name}`;
}

export type PricedOrderFixture = {
  customer: CustomerFixture;
  driver: DriverFixture;
  tripId: string;
  orderId: string;
  itemIds: string[];
  itemPrices: number[];
  serviceFee: number;
  baseFee: number;
  pricedAt: Date;
  deadline: Date;
};

export async function createPricedOrder(
  opts: { itemPrices?: number[]; serviceFee?: number; baseFee?: number; pricedAt?: Date } = {}
): Promise<PricedOrderFixture> {
  const itemPrices = opts.itemPrices ?? [55_000];
  const serviceFee = opts.serviceFee ?? 25_000;
  const baseFee = opts.baseFee ?? 10_000;
  const pricedAt = opts.pricedAt ?? new Date();
  const customer = await createUser("CUSTOMER");
  const driver = await createUser("DRIVER");
  const tripId = await createTripFixture(driver.driverProfileId, baseFee);
  const order = await createOrder(customer.id, {
    tripId,
    items: itemPrices.map((price, index) => ({
      name: `Barang ${index + 1}`,
      imageUrl: itemImageUrl(customer.id, `barang-${index + 1}.webp`),
      quantity: 1,
      estimatedPrice: price,
    })),
    customerNote: "Catatan uji",
  });
  if (order.items.length !== itemPrices.length) {
    throw new Error("Fixture order tidak memiliki item yang diharapkan");
  }
  const itemIds = order.items.map((item) => item.id);
  const priced = await setPrice(
    driver.id,
    order.id,
    { items: itemPrices.map((price, index) => ({ id: itemIds[index], finalPrice: price })), serviceFee },
    pricedAt
  );
  if (!priced.paymentDeadline) {
    throw new Error("Fixture order tidak memiliki paymentDeadline");
  }
  return {
    customer,
    driver,
    tripId,
    orderId: order.id,
    itemIds,
    itemPrices,
    serviceFee,
    baseFee,
    pricedAt,
    deadline: priced.paymentDeadline,
  };
}

export async function payPricedOrder(fixture: PricedOrderFixture, offsetMs = 60_000) {
  return payOrder(
    fixture.customer.id,
    fixture.orderId,
    { method: "QRIS", idempotencyKey: crypto.randomUUID() },
    new Date(fixture.pricedAt.getTime() + offsetMs)
  );
}

export type UnpricedOrderFixture = {
  customer: CustomerFixture;
  driver: DriverFixture;
  tripId: string;
  orderId: string;
  itemIds: string[];
  baseFee: number;
};

export async function createUnpricedOrder(opts: { baseFee?: number } = {}): Promise<UnpricedOrderFixture> {
  const baseFee = opts.baseFee ?? 10_000;
  const customer = await createUser("CUSTOMER");
  const driver = await createUser("DRIVER");
  const tripId = await createTripFixture(driver.driverProfileId, baseFee);
  const order = await createOrder(customer.id, {
    tripId,
    items: [
      {
        name: "Barang 1",
        imageUrl: itemImageUrl(customer.id, "barang-1.webp"),
        quantity: 1,
        estimatedPrice: 50_000,
      },
    ],
    customerNote: "Catatan uji",
  });
  return {
    customer,
    driver,
    tripId,
    orderId: order.id,
    itemIds: order.items.map((item) => item.id),
    baseFee,
  };
}

export async function orderStatus(orderId: string): Promise<string> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { status: true },
  });
  return order.status;
}

export async function driverBalance(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  return wallet.balance;
}
