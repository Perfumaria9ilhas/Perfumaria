CREATE TABLE "StoreMetric" (
    "id" TEXT NOT NULL,
    "totalSatisfiedCustomers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailySiteVisit" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySiteVisit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailySiteVisit_dateKey_key" ON "DailySiteVisit"("dateKey");
CREATE INDEX "DailySiteVisit_dateKey_idx" ON "DailySiteVisit"("dateKey");

INSERT INTO "StoreMetric" ("id", "totalSatisfiedCustomers", "createdAt", "updatedAt")
SELECT
    'main',
    COUNT(*),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "SiteOrder"
WHERE "status" <> 'cancelado'
ON CONFLICT ("id") DO NOTHING;
