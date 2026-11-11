import type { PaymentMethod } from "@prisma/client";
import { mockGateway } from "./mock";

export type ChargeInput = {
  orderId: string;
  amount: number;
  method: PaymentMethod;
};

export type ChargeResult = {
  ref: string;
  status: "PAID" | "FAILED";
};

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export const paymentGateway: PaymentGateway = mockGateway;
