CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");
CREATE UNIQUE INDEX "ProductType_slug_key" ON "ProductType"("slug");

INSERT INTO "ProductType" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
    ('ptype_edp', 'EDP', 'edp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_edt', 'EDT', 'edt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_parfum', 'Parfum', 'parfum', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_extrait', 'Extrait', 'extrait', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_elixir', 'Elixir', 'elixir', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_pasta_corporal', 'Pasta Corporal', 'pasta-corporal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_ambientador', 'Ambientador', 'ambientador', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_gift_set', 'Gift Set', 'gift-set', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ptype_oleo_perfumado', 'Óleo Perfumado', 'oleo-perfumado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Product" ADD COLUMN "productTypeId" TEXT;

UPDATE "Product" AS product
SET "productTypeId" = product_type."id"
FROM "ProductType" AS product_type
WHERE product_type."slug" = CASE product."concentration"
    WHEN 'EDT' THEN 'edt'
    WHEN 'PARFUM' THEN 'parfum'
    WHEN 'EXTRAIT' THEN 'extrait'
    WHEN 'ELIXIR' THEN 'elixir'
    ELSE 'edp'
END;

ALTER TABLE "Product" ALTER COLUMN "productTypeId" SET NOT NULL;

CREATE INDEX "Product_productTypeId_idx" ON "Product"("productTypeId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_productTypeId_fkey"
FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
