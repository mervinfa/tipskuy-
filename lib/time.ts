import { env } from "@/lib/env";

export const PAYMENT_WINDOW_MS = env.PAYMENT_WINDOW_SECONDS * 1000;

export type Clock = Date;

export function paymentDeadlineFrom(pricedAt: Date): Date {
  return new Date(pricedAt.getTime() + PAYMENT_WINDOW_MS);
}

export function calcRemainingMs(deadlineIso: string, serverTimeIso: string, deviceNowMs: number): number {
  const deadlineMs = new Date(deadlineIso).getTime();
  const serverMs = new Date(serverTimeIso).getTime();
  const offset = serverMs - deviceNowMs;
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(serverMs)) return 0;
  return Math.max(0, deadlineMs - (deviceNowMs + offset));
}

export function formatMmSs(remainingMs: number): { mm: number; ss: number } {
  return {
    mm: Math.floor(remainingMs / 60000),
    ss: Math.floor((remainingMs % 60000) / 1000),
  };
}
