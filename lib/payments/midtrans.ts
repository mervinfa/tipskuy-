import { createHash, timingSafeEqual } from "node:crypto";
import { getMidtransConfig } from "@/lib/env";
import { AppError } from "@/lib/http";

export type MidtransItemDetail = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

export type MidtransCustomerDetail = {
  first_name: string;
  email?: string;
  phone?: string;
};

export type CreateSnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  items: MidtransItemDetail[];
  customer: MidtransCustomerDetail;
};

export type SnapTransactionResult = {
  token: string;
  redirect_url: string;
};

export async function createMidtransSnapTransaction(
  input: CreateSnapTransactionInput
): Promise<SnapTransactionResult> {
  const { serverKey, snapUrl } = getMidtransConfig();
  if (!serverKey) {
    throw new AppError(500, "MIDTRANS_CONFIG_ERROR", "MIDTRANS_SERVER_KEY belum dikonfigurasi");
  }

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  const payload = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: Math.round(input.grossAmount),
    },
    item_details: input.items.map((item) => ({
      id: item.id.slice(0, 50),
      price: Math.round(item.price),
      quantity: Math.max(1, Math.round(item.quantity)),
      name: item.name.slice(0, 50),
    })),
    customer_details: {
      first_name: input.customer.first_name.slice(0, 50),
      ...(input.customer.email ? { email: input.customer.email } : {}),
      ...(input.customer.phone ? { phone: input.customer.phone } : {}),
    },
    credit_card: {
      secure: true,
    },
  };

  const response = await fetch(snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gagal membuat transaksi Midtrans Snap:", response.status, errorText);
    throw new AppError(
      502,
      "MIDTRANS_ERROR",
      `Gagal menghubungi gateway pembayaran Midtrans (Status ${response.status})`
    );
  }

  const data = (await response.json()) as SnapTransactionResult;
  return data;
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string
): boolean {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) return false;

  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = createHash("sha512").update(rawString).digest("hex");

  if (computedHash.length !== receivedSignature.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(computedHash, "utf8"),
      Buffer.from(receivedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

export type MidtransStatusResult = {
  status_code: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount: string;
  order_id: string;
  payment_type?: string;
};

export async function checkMidtransStatus(
  midtransOrderId: string
): Promise<MidtransStatusResult | null> {
  const { isProduction, serverKey } = getMidtransConfig();
  if (!serverKey) return null;

  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  try {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(midtransOrderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as MidtransStatusResult;
    return data;
  } catch (err) {
    console.error("Gagal memeriksa status ke Midtrans API:", err);
    return null;
  }
}

