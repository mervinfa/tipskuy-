import { describe, expect, it } from "vitest";
import { calcTotals } from "@/lib/orders/pricing";

describe("calcTotals", () => {
  it("U-05: subtotal 55.000, jasa 25.000, bps 500", () => {
    const totals = calcTotals({ itemPrices: [55_000], serviceFee: 25_000, feeBps: 500 });
    expect(totals.itemSubtotal).toBe(55_000);
    expect(totals.serviceFee).toBe(25_000);
    expect(totals.platformFee).toBe(1_250);
    expect(totals.totalAmount).toBe(81_250);
    expect(totals.driverPayout).toBe(80_000);
  });

  it("U-06: jasa 0 dan harga 0 menghasilkan total 0 tanpa NaN", () => {
    const totals = calcTotals({ itemPrices: [0, 0], serviceFee: 0, feeBps: 500 });
    expect(totals.platformFee).toBe(0);
    expect(totals.totalAmount).toBe(0);
    expect(totals.driverPayout).toBe(0);
    expect(Number.isNaN(totals.totalAmount)).toBe(false);
  });

  it("U-07: nilai pecahan ditolak", () => {
    expect(() => calcTotals({ itemPrices: [1_000.5], serviceFee: 100, feeBps: 500 })).toThrowError(
      "NON_INTEGER_AMOUNT"
    );
    expect(() => calcTotals({ itemPrices: [1_000], serviceFee: 100.5, feeBps: 500 })).toThrowError(
      "NON_INTEGER_AMOUNT"
    );
  });

  it("U-07: nilai negatif ditolak", () => {
    expect(() => calcTotals({ itemPrices: [-1_000], serviceFee: 100, feeBps: 500 })).toThrowError(
      "NEGATIVE_AMOUNT"
    );
    expect(() => calcTotals({ itemPrices: [1_000], serviceFee: -100, feeBps: 500 })).toThrowError(
      "NEGATIVE_AMOUNT"
    );
  });

  it("U-08: fee dibulatkan ke bawah dan total konsisten", () => {
    const totals = calcTotals({ itemPrices: [], serviceFee: 10_001, feeBps: 500 });
    expect(totals.platformFee).toBe(500);
    expect(totals.totalAmount).toBe(totals.itemSubtotal + totals.serviceFee + totals.platformFee);
  });
});
