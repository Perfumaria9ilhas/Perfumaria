ALTER TABLE "Product"
ADD COLUMN "homeFeatured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET "homeFeatured" = true
WHERE "id" IN (
  SELECT "id"
  FROM "Product"
  WHERE "active" = true
    AND ("featured" = true OR "bestseller" = true)
  ORDER BY "bestseller" DESC, "featured" DESC, "updatedAt" DESC
  LIMIT 5
);
