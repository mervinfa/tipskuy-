export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const digits = Math.abs(Math.trunc(amount)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp${grouped}`;
}
