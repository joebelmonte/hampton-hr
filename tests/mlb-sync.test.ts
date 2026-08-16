import { describe, expect, it } from "vitest";
import { isCountedMlbGame } from "../src/lib/mlb-game";

describe("isCountedMlbGame", () => {
  it("excludes All-Star games from scoring", () => {
    expect(isCountedMlbGame({ gamePk: 1, officialDate: "2026-07-14", gameType: "A", status: { abstractGameState: "Final" } })).toBe(false);
  });

  it("includes completed regular-season games", () => {
    expect(isCountedMlbGame({ gamePk: 1, officialDate: "2026-07-14", gameType: "R", status: { abstractGameState: "Final" } })).toBe(true);
  });
});
