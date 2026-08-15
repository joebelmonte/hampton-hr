-- CreateTable
CREATE TABLE "MlbBackfill" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "nextDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MlbBackfill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MlbBackfill_status_createdAt_idx" ON "MlbBackfill"("status", "createdAt");
