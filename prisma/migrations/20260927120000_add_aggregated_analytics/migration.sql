-- Additive analytics tables. DailySiteVisit remains available as the audited migration source.
CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "productViews" INTEGER NOT NULL DEFAULT 0,
    "addToCartEvents" INTEGER NOT NULL DEFAULT 0,
    "addedUnits" INTEGER NOT NULL DEFAULT 0,
    "checkoutWhatsapp" INTEGER NOT NULL DEFAULT 0,
    "reservations" INTEGER NOT NULL DEFAULT 0,
    "generalWhatsappContacts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "addToCartEvents" INTEGER NOT NULL DEFAULT 0,
    "addedUnits" INTEGER NOT NULL DEFAULT 0,
    "checkoutEvents" INTEGER NOT NULL DEFAULT 0,
    "checkoutUnits" INTEGER NOT NULL DEFAULT 0,
    "reservationEvents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "normalizedTerm" TEXT NOT NULL,
    "displayTerm" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "resultCountTotal" INTEGER NOT NULL DEFAULT 0,
    "zeroResultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SearchAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsDaily_dateKey_key" ON "AnalyticsDaily"("dateKey");
CREATE INDEX "AnalyticsDaily_dateKey_idx" ON "AnalyticsDaily"("dateKey");
CREATE UNIQUE INDEX "ProductAnalyticsDaily_dateKey_productId_key" ON "ProductAnalyticsDaily"("dateKey", "productId");
CREATE INDEX "ProductAnalyticsDaily_dateKey_idx" ON "ProductAnalyticsDaily"("dateKey");
CREATE INDEX "ProductAnalyticsDaily_productId_dateKey_idx" ON "ProductAnalyticsDaily"("productId", "dateKey");
CREATE UNIQUE INDEX "SearchAnalyticsDaily_dateKey_normalizedTerm_key" ON "SearchAnalyticsDaily"("dateKey", "normalizedTerm");
CREATE INDEX "SearchAnalyticsDaily_dateKey_idx" ON "SearchAnalyticsDaily"("dateKey");
CREATE INDEX "SearchAnalyticsDaily_normalizedTerm_dateKey_idx" ON "SearchAnalyticsDaily"("normalizedTerm", "dateKey");

ALTER TABLE "ProductAnalyticsDaily"
ADD CONSTRAINT "ProductAnalyticsDaily_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve every historical day exactly once. Re-running is idempotent.
INSERT INTO "AnalyticsDaily" (
    "id", "dateKey", "visits", "createdAt", "updatedAt"
)
SELECT
    'analytics-migrated-' || "id", "dateKey", "visitCount", "createdAt", "updatedAt"
FROM "DailySiteVisit"
ON CONFLICT ("dateKey") DO UPDATE
SET "visits" = EXCLUDED."visits",
    "updatedAt" = GREATEST("AnalyticsDaily"."updatedAt", EXCLUDED."updatedAt");
