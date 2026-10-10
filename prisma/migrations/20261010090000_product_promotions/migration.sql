CREATE TYPE "PromotionMethod" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "PromotionStatus" AS ENUM ('ENABLED', 'DISABLED', 'ENDED');
CREATE TABLE "ProductPromotion" (
  "id" TEXT PRIMARY KEY, "productId" TEXT NOT NULL UNIQUE REFERENCES "Product"("id") ON DELETE CASCADE,
  "method" "PromotionMethod" NOT NULL, "value" INTEGER NOT NULL,
  "startsAt" TIMESTAMPTZ(3) NOT NULL, "endsAt" TIMESTAMPTZ(3),
  "status" "PromotionStatus" NOT NULL DEFAULT 'ENABLED', "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_value" CHECK ("value" > 0 AND ("method" <> 'PERCENT' OR "value" < 10000)),
  CONSTRAINT "promotion_dates" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt")
);
CREATE INDEX "ProductPromotion_status_startsAt_endsAt_idx" ON "ProductPromotion"("status", "startsAt", "endsAt");
CREATE TABLE "PromotionAudit" (
  "id" TEXT PRIMARY KEY, "promotionId" TEXT NOT NULL, "productId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "previous" JSONB, "next" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PromotionAudit_productId_createdAt_idx" ON "PromotionAudit"("productId", "createdAt");
CREATE TABLE "CustomerFavorite" (
  "customerId" TEXT NOT NULL REFERENCES "CustomerAccount"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("customerId", "productId")
);
ALTER TABLE "ProductPromotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromotionAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerFavorite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ProductPromotion", "PromotionAudit", "CustomerFavorite" FROM PUBLIC;
CREATE FUNCTION nineilhas_promotion_audit_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Promotion history is immutable'; END; $$;
CREATE TRIGGER "PromotionAudit_immutable" BEFORE UPDATE OR DELETE ON "PromotionAudit" FOR EACH ROW EXECUTE FUNCTION nineilhas_promotion_audit_guard();
