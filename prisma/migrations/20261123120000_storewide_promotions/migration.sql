ALTER TYPE "PromotionMethod" ADD VALUE 'AMOUNT';
ALTER TABLE "ProductPromotion" ADD COLUMN "includeVariants" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "StorePromotion" (
 "id" TEXT NOT NULL,
 "method" "PromotionMethod" NOT NULL,
 "value" INTEGER NOT NULL,
 "startsAt" TIMESTAMPTZ(3) NOT NULL,
 "endsAt" TIMESTAMPTZ(3),
 "status" "PromotionStatus" NOT NULL DEFAULT 'ENABLED',
 "actorId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "StorePromotion_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "StorePromotion_singleton_check" CHECK ("id" = 'main'),
 CONSTRAINT "StorePromotion_method_check" CHECK ("method"::text IN ('PERCENT','AMOUNT')),
 CONSTRAINT "StorePromotion_value_check" CHECK ("value" > 0 AND ("method" <> 'PERCENT' OR "value" < 10000))
);

ALTER TABLE "StorePromotion" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "StorePromotion" FROM PUBLIC;
