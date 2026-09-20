CREATE TYPE "StockSaleStatus" AS ENUM ('PENDING', 'PAID', 'OFFERED');

ALTER TABLE "StockMovement"
ADD COLUMN "saleGroupId" TEXT,
ADD COLUMN "saleStatus" "StockSaleStatus";

CREATE INDEX "StockMovement_saleGroupId_idx" ON "StockMovement"("saleGroupId");
CREATE INDEX "StockMovement_saleStatus_createdAt_idx" ON "StockMovement"("saleStatus", "createdAt");
