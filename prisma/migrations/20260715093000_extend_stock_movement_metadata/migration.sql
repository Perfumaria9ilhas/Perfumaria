CREATE TYPE "StockMovementReason" AS ENUM (
    'SALE',
    'GIFT',
    'LOSS',
    'DECANT',
    'INTERNAL_USE',
    'OTHER',
    'MANUAL'
);

ALTER TABLE "StockMovement"
ADD COLUMN "reason" "StockMovementReason",
ADD COLUMN "supplier" TEXT;
