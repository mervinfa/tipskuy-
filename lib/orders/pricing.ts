export type Totals = {
  itemSubtotal: number;
  serviceFee: number;
  platformFee: number;
  totalAmount: number;
  driverPayout: number;
};

// Semua kalkulasi total untuk penagihan WAJIB lewat fungsi ini (AGENTS 5.6).
export function calcTotals(input: { itemPrices: number[]; serviceFee: number; feeBps: number }): Totals {
  const { itemPrices, serviceFee, feeBps } = input;
  const amounts = [...itemPrices, serviceFee];
  if (!amounts.every(Number.isInteger)) throw new Error("NON_INTEGER_AMOUNT");
  if (!amounts.every((a) => a >= 0)) throw new Error("NEGATIVE_AMOUNT");
  const itemSubtotal = itemPrices.reduce((a, b) => a + b, 0);
  // Math.floor agar total selalu konsisten dengan CHECK constraint database.
  const platformFee = Math.floor((serviceFee * feeBps) / 10_000);
  const totalAmount = itemSubtotal + serviceFee + platformFee;
  const driverPayout = itemSubtotal + serviceFee; // totalAmount - platformFee
  return { itemSubtotal, serviceFee, platformFee, totalAmount, driverPayout };
}
