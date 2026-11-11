import { describe, expect, it } from "vitest";
import { formatRupiah } from "@/lib/format";

describe("formatRupiah", () => {
  it("memformat bilangan bulat dengan pemisah ribuan", () => {
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(81_250)).toBe("Rp81.250");
    expect(formatRupiah(1_000_000)).toBe("Rp1.000.000");
  });

  it("menangani nilai negatif dan pecahan", () => {
    expect(formatRupiah(-5_000)).toBe("-Rp5.000");
    expect(formatRupiah(1_500.99)).toBe("Rp1.500");
  });
});
