CREATE TYPE "StockDeliveryStatus" AS ENUM ('DELIVERED', 'PENDING');

ALTER TABLE "StockMovement"
ADD COLUMN "deliveryStatus" "StockDeliveryStatus";
