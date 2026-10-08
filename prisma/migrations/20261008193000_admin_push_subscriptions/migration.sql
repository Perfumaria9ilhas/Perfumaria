CREATE TABLE "AdminPushSubscription" (
  "id" TEXT NOT NULL, "adminId" TEXT NOT NULL, "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL, "auth" TEXT NOT NULL,
  "payments" BOOLEAN NOT NULL DEFAULT true, "deliveries" BOOLEAN NOT NULL DEFAULT true,
  "stock" BOOLEAN NOT NULL DEFAULT true, "lastAlertFingerprint" TEXT,
  "lastTestAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AdminPushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminPushSubscription_endpoint_key" ON "AdminPushSubscription"("endpoint");
CREATE INDEX "AdminPushSubscription_adminId_idx" ON "AdminPushSubscription"("adminId");
