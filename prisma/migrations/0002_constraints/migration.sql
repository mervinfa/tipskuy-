ALTER TABLE "Wallet" ADD CONSTRAINT wallet_balance_non_negative CHECK ("balance" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT order_amounts_non_negative CHECK (
  ("itemSubtotal" IS NULL OR "itemSubtotal" >= 0) AND
  ("serviceFee" IS NULL OR "serviceFee" >= 0) AND
  ("platformFee" IS NULL OR "platformFee" >= 0) AND
  ("totalAmount" IS NULL OR "totalAmount" >= 0)
);
ALTER TABLE "Order" ADD CONSTRAINT order_total_consistent CHECK (
  "totalAmount" IS NULL OR "totalAmount" = "itemSubtotal" + "serviceFee" + "platformFee"
);
CREATE INDEX order_pending_payment_idx ON "Order" ("paymentDeadline")
  WHERE "status" = 'WAITING_CUSTOMER_PAYMENT';
