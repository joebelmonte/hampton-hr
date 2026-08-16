import { describe, expect, it } from "vitest";
import { startOfLeagueDay } from "../src/lib/league-date";

describe("startOfLeagueDay", () => {
  it("uses the Eastern calendar date after UTC has rolled into the next day", () => {
    expect(startOfLeagueDay(new Date("2026-08-16T02:03:00.000Z")).toISOString()).toBe("2026-08-15T00:00:00.000Z");
  });

  it("advances when the Eastern calendar day changes", () => {
    expect(startOfLeagueDay(new Date("2026-08-16T04:03:00.000Z")).toISOString()).toBe("2026-08-16T00:00:00.000Z");
  });
});
