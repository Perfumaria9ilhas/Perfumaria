CREATE TYPE "ProductConcentration" AS ENUM ('EDT', 'EDP', 'PARFUM', 'EXTRAIT', 'ELIXIR');

ALTER TABLE "Product"
ADD COLUMN "concentration" "ProductConcentration" NOT NULL DEFAULT 'EDP';
