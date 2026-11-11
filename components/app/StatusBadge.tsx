import type { OrderStatus } from "./types";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./format";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-2.5 py-1 text-xs font-extrabold ${ORDER_STATUS_TONE[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
