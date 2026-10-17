CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");
CREATE INDEX "Season_status_idx" ON "Season"("status");

INSERT INTO "Season" ("id", "year", "startDate", "status", "createdAt", "updatedAt")
VALUES ('season-2026', 2026, DATE '2026-03-26', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Team" ADD COLUMN "seasonId" TEXT;
UPDATE "Team" SET "seasonId" = 'season-2026';
ALTER TABLE "Team" ALTER COLUMN "seasonId" SET NOT NULL;

DROP INDEX "Team_name_key";
DROP INDEX "Team_slug_key";
CREATE UNIQUE INDEX "Team_seasonId_name_key" ON "Team"("seasonId", "name");
CREATE UNIQUE INDEX "Team_seasonId_slug_key" ON "Team"("seasonId", "slug");
CREATE INDEX "Team_seasonId_idx" ON "Team"("seasonId");

ALTER TABLE "Team" ADD CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
