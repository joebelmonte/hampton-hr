-- CreateTable
CREATE TABLE "DailyEmailDelivery" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyEmailDelivery_teamId_asOfDate_key" ON "DailyEmailDelivery"("teamId", "asOfDate");

-- AddForeignKey
ALTER TABLE "DailyEmailDelivery" ADD CONSTRAINT "DailyEmailDelivery_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
