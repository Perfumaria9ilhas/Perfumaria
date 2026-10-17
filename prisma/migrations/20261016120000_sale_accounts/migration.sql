CREATE TABLE "SaleAccount" (
 "id" TEXT PRIMARY KEY, "version" INTEGER NOT NULL DEFAULT 0,
 "opening" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "SaleAccountEvent" (
 "id" TEXT PRIMARY KEY, "requestId" TEXT NOT NULL, "accountId" TEXT NOT NULL,
 "kind" TEXT NOT NULL, "amount" INTEGER NOT NULL DEFAULT 0, "movementId" TEXT,
 "delivered" INTEGER, "reversesId" TEXT, "method" TEXT, "reason" TEXT,
 "actorId" TEXT NOT NULL, "actorName" TEXT NOT NULL,
 "occurredAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SaleAccountEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SaleAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "SaleAccountEvent_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "SaleAccountEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "SaleAccountEvent_kind_check" CHECK ("kind" IN ('PAYMENT','REVERSAL','DELIVERY','OPENING_CORRECTION')),
 CONSTRAINT "SaleAccountEvent_amount_check" CHECK (("kind"='PAYMENT' AND "amount">0) OR ("kind"='REVERSAL' AND "amount"<0) OR ("kind"='OPENING_CORRECTION' AND "amount"<>0) OR ("kind"='DELIVERY' AND "amount"=0 AND "delivered">=0))
);
CREATE UNIQUE INDEX "SaleAccountEvent_requestId_key" ON "SaleAccountEvent"("requestId");
CREATE UNIQUE INDEX "SaleAccountEvent_reversesId_key" ON "SaleAccountEvent"("reversesId");
CREATE INDEX "SaleAccountEvent_accountId_createdAt_idx" ON "SaleAccountEvent"("accountId","createdAt");
CREATE INDEX "SaleAccountEvent_occurredAt_idx" ON "SaleAccountEvent"("occurredAt");

CREATE TABLE "SaleAccountItem" (
 "movementId" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL,
 CONSTRAINT "SaleAccountItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SaleAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "SaleAccountItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "StockMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SaleAccountItem_accountId_idx" ON "SaleAccountItem"("accountId");
