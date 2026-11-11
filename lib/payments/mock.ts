import type { PaymentGateway } from "./index";
import { env } from "@/lib/env";

// Gateway mock untuk development dan pengujian: selalu berhasil sinkron.
// Gateway produksi (Midtrans/Xendit) menggantikan implementasi ini lewat env PAYMENT_PROVIDER.
export const mockGateway: PaymentGateway = {
  async charge(input) {
    const random = Math.random().toString(36).slice(2, 10);
    return { ref: `mock_${env.PAYMENT_PROVIDER}_${input.orderId}_${random}`, status: "PAID" };
  },
};
