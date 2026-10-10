-- Recovery only. This migration was never applied to a persistent database before revision.
CREATE TABLE "CustomerPasswordReset" (
 "id" TEXT PRIMARY KEY, "customerId" TEXT NOT NULL REFERENCES "CustomerAccount"("id") ON DELETE CASCADE,
 "expiresAt" TIMESTAMP(3) NOT NULL, "sessionVersion" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CustomerPasswordReset_customerId_createdAt_idx" ON "CustomerPasswordReset"("customerId","createdAt");
CREATE TABLE "CustomerAuthThrottle" ("id" TEXT PRIMARY KEY,"count" INTEGER NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL);
ALTER TABLE "CustomerPasswordReset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerAuthThrottle" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "CustomerPasswordReset", "CustomerAuthThrottle" FROM PUBLIC;
