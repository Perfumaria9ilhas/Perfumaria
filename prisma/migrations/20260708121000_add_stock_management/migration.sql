ALTER TABLE "Product"
ADD COLUMN "purchaseCostInCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lowStockAlert" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "stockNotes" TEXT;

CREATE TYPE "StockMovementType" AS ENUM ('ENTRY', 'SALE', 'ADJUSTMENT');

CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "resultingStock" INTEGER NOT NULL,
    "unitCostInCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
