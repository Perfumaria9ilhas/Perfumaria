ALTER TABLE "Product"
ADD COLUMN "sizeLabel" TEXT NOT NULL DEFAULT '100 ml';

UPDATE "Product"
SET "sizeLabel" = regexp_replace(
  "name",
  '.*?([0-9]+)\s*[x×]\s*([0-9]+)\s*ml.*',
  '\1 × \2 ml',
  'i'
)
WHERE "name" ~* '[0-9]+\s*[x×]\s*[0-9]+\s*ml';

UPDATE "Product"
SET "sizeLabel" = regexp_replace(
  "name",
  '.*?([0-9]+)\s*(ml|g).*',
  '\1 \2',
  'i'
)
WHERE "name" ~* '[0-9]+\s*(ml|g)'
  AND "name" !~* '[0-9]+\s*[x×]\s*[0-9]+\s*ml';
