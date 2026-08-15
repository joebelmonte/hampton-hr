-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "mlbPlayerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAssignment" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotId" TEXT,
    "teamId" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeRunEvent" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "gameDate" DATE NOT NULL,
    "inning" INTEGER,
    "hrNumberInGame" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeRunEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTotal" (
    "slotId" TEXT NOT NULL,
    "totalHomeRuns" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlotTotal_pkey" PRIMARY KEY ("slotId")
);

-- CreateTable
CREATE TABLE "RosterTransaction" (
    "id" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "playerOutId" TEXT,
    "playerInId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosterTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandingsSnapshot" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "teamPoints" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "StandingsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_teamId_number_key" ON "Slot"("teamId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Player_mlbPlayerId_key" ON "Player"("mlbPlayerId");

-- CreateIndex
CREATE INDEX "PlayerAssignment_playerId_effectiveDate_idx" ON "PlayerAssignment"("playerId", "effectiveDate");

-- CreateIndex
CREATE INDEX "PlayerAssignment_slotId_effectiveDate_idx" ON "PlayerAssignment"("slotId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAssignment_playerId_effectiveDate_key" ON "PlayerAssignment"("playerId", "effectiveDate");

-- CreateIndex
CREATE INDEX "HomeRunEvent_gameDate_idx" ON "HomeRunEvent"("gameDate");

-- CreateIndex
CREATE UNIQUE INDEX "HomeRunEvent_gameId_playerId_hrNumberInGame_key" ON "HomeRunEvent"("gameId", "playerId", "hrNumberInGame");

-- CreateIndex
CREATE INDEX "RosterTransaction_teamId_effectiveDate_idx" ON "RosterTransaction"("teamId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "StandingsSnapshot_teamId_asOfDate_key" ON "StandingsSnapshot"("teamId", "asOfDate");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeRunEvent" ADD CONSTRAINT "HomeRunEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotTotal" ADD CONSTRAINT "SlotTotal_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransaction" ADD CONSTRAINT "RosterTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransaction" ADD CONSTRAINT "RosterTransaction_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransaction" ADD CONSTRAINT "RosterTransaction_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransaction" ADD CONSTRAINT "RosterTransaction_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandingsSnapshot" ADD CONSTRAINT "StandingsSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
