import { describe, expect, it } from "vitest";
import { isMlbStatsStale, PUBLIC_STATS_REFRESH_INTERVAL_MS } from "../src/lib/stats-refresh";

describe("public stats refresh", () => {
  const now = Date.UTC(2026, 7, 16, 18, 0, 0);

  it("refreshes when no successful sync has been recorded", () => {
    expect(isMlbStatsStale(null, now)).toBe(true);
  });

  it("waits at least fifteen minutes after a successful sync", () => {
    expect(isMlbStatsStale(new Date(now - PUBLIC_STATS_REFRESH_INTERVAL_MS), now)).toBe(false);
    expect(isMlbStatsStale(new Date(now - PUBLIC_STATS_REFRESH_INTERVAL_MS - 1), now)).toBe(true);
  });
});
