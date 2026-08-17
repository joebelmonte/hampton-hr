export const PUBLIC_STATS_REFRESH_INTERVAL_MS = 15 * 60 * 1_000;

export function isMlbStatsStale(lastSyncedAt: Date | null, now = Date.now()) {
  return !lastSyncedAt || now - lastSyncedAt.getTime() > PUBLIC_STATS_REFRESH_INTERVAL_MS;
}
