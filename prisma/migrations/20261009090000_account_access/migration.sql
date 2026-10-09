CREATE TYPE "AccountRole" AS ENUM ('CUSTOMER', 'ADMIN');
ALTER TABLE "CustomerAccount" ADD COLUMN "role" "AccountRole" NOT NULL DEFAULT 'CUSTOMER', ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "lastLoginAt" TIMESTAMP(3), ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
-- Previously only the Railway account could log in to Admin. Do not silently
-- enable dormant/seeded AdminUser passwords as part of this migration.
ALTER TABLE "AdminUser" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "lastLoginAt" TIMESTAMP(3);
CREATE TABLE "AccountSecurity" ("id" TEXT PRIMARY KEY CHECK ("id" = 'main'), "principalId" TEXT NOT NULL UNIQUE CHECK ("principalId" = 'configured-admin'), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "AccountSecurity" ("id", "principalId") VALUES ('main', 'configured-admin');
CREATE TABLE "AccountAudit" ("id" TEXT PRIMARY KEY, "actorId" TEXT NOT NULL, "targetId" TEXT NOT NULL, "targetKind" TEXT NOT NULL, "action" TEXT NOT NULL, "previous" JSONB, "next" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "AccountAudit_targetId_createdAt_idx" ON "AccountAudit"("targetId", "createdAt");
ALTER TABLE "CustomerAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountSecurity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountAudit" ENABLE ROW LEVEL SECURITY;
-- No browser database role has a policy or grant on authentication data.
-- The existing private backend owner connection is retained; triggers below
-- also protect sensitive writes made by that owner connection.
REVOKE ALL ON "CustomerAccount", "AdminUser", "AccountSecurity", "AccountAudit" FROM PUBLIC;
CREATE FUNCTION nineilhas_account_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE principal text; actor text;
BEGIN
  SELECT "principalId" INTO principal FROM "AccountSecurity" WHERE "id" = 'main';
  actor := current_setting('nineilhas.account_actor', true);
  IF TG_TABLE_NAME = 'AccountSecurity' OR (TG_TABLE_NAME = 'AccountAudit' AND TG_OP <> 'INSERT') THEN
    RAISE EXCEPTION 'Security identity and audit history are immutable';
  END IF;
  IF TG_TABLE_NAME = 'AccountAudit' THEN
    IF actor IS DISTINCT FROM NEW."actorId" OR (actor IS DISTINCT FROM principal AND NOT (NEW."action" = 'REQUEST_DELETION' AND actor = NEW."targetId" AND NEW."targetKind" = 'CUSTOMER')) THEN RAISE EXCEPTION 'Unauthorized audit write'; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD."id" = principal OR actor IS DISTINCT FROM principal THEN RAISE EXCEPTION 'Unauthorized account deletion'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."id" <> NEW."id" THEN RAISE EXCEPTION 'Authentication identity is immutable'; END IF;
    IF OLD."id" = principal THEN RAISE EXCEPTION 'Principal account is protected'; END IF;
    IF OLD."active" <> NEW."active" OR OLD."sessionVersion" <> NEW."sessionVersion" THEN
      IF actor IS DISTINCT FROM principal THEN RAISE EXCEPTION 'Unauthorized account security change'; END IF;
    END IF;
    IF TG_TABLE_NAME = 'CustomerAccount' THEN
      IF OLD."role" <> NEW."role" AND actor IS DISTINCT FROM principal THEN RAISE EXCEPTION 'Unauthorized role change'; END IF;
    END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW."id" = principal THEN RAISE EXCEPTION 'Principal identity is reserved'; END IF;
    IF TG_TABLE_NAME = 'CustomerAccount' THEN
      IF NEW."role" <> 'CUSTOMER' AND actor IS DISTINCT FROM principal THEN RAISE EXCEPTION 'Unauthorized initial role'; END IF;
    END IF;
    IF TG_TABLE_NAME = 'AdminUser' AND NEW."active" AND actor IS DISTINCT FROM principal THEN RAISE EXCEPTION 'Unauthorized administrator creation'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "CustomerAccount_access_guard" BEFORE INSERT OR UPDATE OR DELETE ON "CustomerAccount" FOR EACH ROW EXECUTE FUNCTION nineilhas_account_guard();
CREATE TRIGGER "AdminUser_access_guard" BEFORE INSERT OR UPDATE OR DELETE ON "AdminUser" FOR EACH ROW EXECUTE FUNCTION nineilhas_account_guard();
CREATE TRIGGER "AccountSecurity_immutable" BEFORE INSERT OR UPDATE OR DELETE ON "AccountSecurity" FOR EACH ROW EXECUTE FUNCTION nineilhas_account_guard();
CREATE TRIGGER "AccountAudit_immutable" BEFORE INSERT OR UPDATE OR DELETE ON "AccountAudit" FOR EACH ROW EXECUTE FUNCTION nineilhas_account_guard();
