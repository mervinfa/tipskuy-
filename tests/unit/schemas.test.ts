import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  deliverOrderSchema,
  payOrderSchema,
  setPriceSchema,
} from "@/types/schemas/order";
import { registerSchema } from "@/types/schemas/auth";
import { withdrawSchema } from "@/types/schemas/upload";

describe("Skema Zod order dan terkait", () => {
  const itemValid = {
    name: "Kopi bubuk",
    imageUrl: "http://localhost:3000/uploads/order-items/user_1/2026/11/barang.webp",
    quantity: 2,
    estimatedPrice: 50_000,
  };

  it("U-11: order tanpa item ditolak", () => {
    const parsed = createOrderSchema.safeParse({ tripId: "trip_1", items: [] });
    expect(parsed.success).toBe(false);
  });

  it("U-11: order dengan 11 item ditolak", () => {
    const items = Array.from({ length: 11 }, (_, i) => ({ ...itemValid, name: `Barang ${i + 1}` }));
    const parsed = createOrderSchema.safeParse({ tripId: "trip_1", items });
    expect(parsed.success).toBe(false);
  });

  it("U-11: imageUrl bukan URL valid ditolak skema", () => {
    const parsed = createOrderSchema.safeParse({
      tripId: "trip_1",
      items: [{ ...itemValid, imageUrl: "bukan-url" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("E-16: field asing pada body set-price ditolak strict mode", () => {
    const parsed = setPriceSchema.safeParse({
      items: [{ id: "item_1", finalPrice: 50_000 }],
      serviceFee: 25_000,
      status: "COMPLETED",
    });
    expect(parsed.success).toBe(false);
  });

  it("E-16: field asing pada body pay ditolak strict mode", () => {
    const parsed = payOrderSchema.safeParse({
      method: "QRIS",
      idempotencyKey: crypto.randomUUID(),
      totalAmount: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("E-16: field asing pada body deliver ditolak strict mode", () => {
    const parsed = deliverOrderSchema.safeParse({
      imageUrl: "http://localhost:3000/uploads/delivery-proofs/user_1/2026/11/bukti.webp",
      driverId: "driver_1",
    });
    expect(parsed.success).toBe(false);
  });

  it("E-16: penarikan tidak menerima field saldo dari client", () => {
    const parsed = withdrawSchema.safeParse({ amount: 10_000, bankCode: "BCA", accountNumber: "1234567890", balance: 999_999 });
    expect(parsed.success).toBe(false);
  });

  it("E-12: set-price menolak finalPrice negatif atau pecahan", () => {
    expect(setPriceSchema.safeParse({ items: [{ id: "item_1", finalPrice: -1 }], serviceFee: 25_000 }).success).toBe(false);
    expect(setPriceSchema.safeParse({ items: [{ id: "item_1", finalPrice: 1_000.5 }], serviceFee: 25_000 }).success).toBe(false);
  });

  it("registrasi driver wajib membawa data driver", () => {
    const parsed = registerSchema.safeParse({
      name: "Driver Uji",
      email: "driver.uji@test.tipskuy",
      password: "Tipskuy123",
      phone: "081234567890",
      role: "DRIVER",
    });
    expect(parsed.success).toBe(false);
  });
});
