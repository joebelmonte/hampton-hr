ALTER TABLE "MlbSyncState"
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "refreshLockAt" TIMESTAMP(3);

UPDATE "MlbSyncState"
SET "lastSyncedAt" = "updatedAt"
WHERE "lastSyncedAt" IS NULL;
