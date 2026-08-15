import { describe, expect, it } from "vitest";
import { teamScore } from "../src/lib/scoring";

describe("teamScore", () => {
  it("counts only the twelve highest scoring slots", () => {
    const scores = Array.from({ length: 14 }, (_, index) => ({ slotId: `slot-${index + 1}`, homeRuns: index + 1 }));
    expect(teamScore(scores)).toBe(102);
  });

  it("handles fewer than twelve populated slots", () => {
    expect(teamScore([{ slotId: "one", homeRuns: 4 }, { slotId: "two", homeRuns: 2 }])).toBe(6);
  });
});
