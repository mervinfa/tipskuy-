import { describe, expect, it } from "vitest";
import { ActorType, OrderStatus } from "@prisma/client";
import { AppError } from "@/lib/http";
import { TRANSITIONS, assertTransition } from "@/lib/orders/state-machine";

const STATUSES = Object.values(OrderStatus);
const ACTORS = Object.values(ActorType);

function expectInvalidTransition(from: OrderStatus, to: OrderStatus, actor: ActorType) {
  try {
    assertTransition(from, to, actor);
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    const err = e as AppError;
    expect(err.status).toBe(409);
    expect(err.code).toBe("INVALID_TRANSITION");
    return;
  }
  throw new Error(`Transisi ${from} -> ${to} oleh ${actor} seharusnya ditolak`);
}

describe("assertTransition", () => {
  it("U-01: menerima semua pasangan valid pada tabel transisi", () => {
    for (const from of STATUSES) {
      const targets = TRANSITIONS[from];
      for (const to of Object.keys(targets) as OrderStatus[]) {
        for (const actor of ACTORS) {
          if (targets[to]?.includes(actor)) {
            expect(() => assertTransition(from, to, actor)).not.toThrow();
          }
        }
      }
    }
  });

  it("U-02: menolak semua pasangan tidak valid dari produk kartesius status", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        for (const actor of ACTORS) {
          if (TRANSITIONS[from][to]?.includes(actor)) {
            continue;
          }
          expectInvalidTransition(from, to, actor);
        }
      }
    }
  });

  it("U-03: DRIVER tidak boleh menyelesaikan pesanan (DELIVERED_PENDING_CONFIRMATION -> COMPLETED)", () => {
    expectInvalidTransition(
      OrderStatus.DELIVERED_PENDING_CONFIRMATION,
      OrderStatus.COMPLETED,
      ActorType.DRIVER
    );
  });

  it("U-04: tidak ada transisi keluar dari status final", () => {
    const finalStatuses: OrderStatus[] = [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED_EXPIRED,
      OrderStatus.REJECTED_BY_CUSTOMER,
      OrderStatus.REJECTED_BY_DRIVER,
      OrderStatus.REFUNDED,
    ];
    for (const from of finalStatuses) {
      for (const to of STATUSES) {
        for (const actor of ACTORS) {
          expectInvalidTransition(from, to, actor);
        }
      }
    }
  });
});
