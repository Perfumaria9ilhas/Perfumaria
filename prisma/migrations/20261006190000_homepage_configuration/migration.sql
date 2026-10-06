-- Additive only: all existing settings and commercial data remain intact.
ALTER TABLE "StoreSettings" ADD COLUMN "homepageConfig" JSONB NOT NULL DEFAULT '{}';
