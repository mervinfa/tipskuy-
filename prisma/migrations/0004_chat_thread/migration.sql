-- Gabungkan percakapan ganda per pasangan customer dan driver ke percakapan tertua.
WITH ranked AS (
  SELECT
    "id",
    "customerId",
    "driverId",
    FIRST_VALUE("id") OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Conversation"
),
dupes AS (
  SELECT "id", keeper_id FROM ranked WHERE rn > 1
)
UPDATE "Message" m
SET "conversationId" = d.keeper_id
FROM dupes d
WHERE m."conversationId" = d."id";

WITH ranked AS (
  SELECT
    "id",
    "customerId",
    "driverId",
    FIRST_VALUE("id") OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Conversation"
),
dupes AS (
  SELECT r."id", r.keeper_id, c."orderId", c."tripId", c."updatedAt"
  FROM ranked r
  JOIN "Conversation" c ON c."id" = r."id"
  WHERE r.rn > 1
)
UPDATE "Conversation" c
SET
  "orderId" = COALESCE(c."orderId", d."orderId"),
  "tripId" = COALESCE(c."tripId", d."tripId"),
  "updatedAt" = GREATEST(c."updatedAt", d."updatedAt")
FROM dupes d
WHERE c."id" = d.keeper_id;

WITH ranked AS (
  SELECT
    "id",
    "customerId",
    "driverId",
    FIRST_VALUE("id") OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY "customerId", "driverId"
      ORDER BY "createdAt", "id"
    ) AS rn
  FROM "Conversation"
),
dupes AS (
  SELECT "id", keeper_id FROM ranked WHERE rn > 1
)
DELETE FROM "Conversation" c
USING dupes d
WHERE c."id" = d."id";

DROP INDEX IF EXISTS conversation_customer_trip_unique;

CREATE UNIQUE INDEX "Conversation_customerId_driverId_key" ON "Conversation" ("customerId", "driverId");
