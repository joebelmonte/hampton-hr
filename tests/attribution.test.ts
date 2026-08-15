import { describe, expect, it } from "vitest";
import { assignmentForGame, slotPointTotals } from "../src/lib/attribution";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe("home-run attribution", () => {
  it("uses the most recent assignment even when history is returned newest first", () => {
    const assignments = [
      { effectiveDate: day("2026-08-08"), slotId: null },
      { effectiveDate: day("2026-07-31"), slotId: "slot-1" },
    ];

    expect(assignmentForGame(assignments, day("2026-08-07"))?.slotId).toBe("slot-1");
    expect(assignmentForGame(assignments, day("2026-08-08"))?.slotId).toBeNull();
  });

  it("keeps a slot total equal to the sum of its player tenures after an out-of-order replacement", () => {
    const events = [
      { gameDate: day("2026-08-01"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: null }, { effectiveDate: day("2026-07-31"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-05"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: null }, { effectiveDate: day("2026-07-31"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-09"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: null }, { effectiveDate: day("2026-07-31"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-10"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-12"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-14"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-15"), assignments: [{ effectiveDate: day("2026-08-08"), slotId: "slot-1" }] },
    ];

    expect(slotPointTotals(events).get("slot-1")).toBe(6);
  });

  it("uses half-open windows so completed-day periods exclude today", () => {
    const events = [
      { gameDate: day("2026-08-08"), assignments: [{ effectiveDate: day("2026-08-01"), slotId: "slot-1" }] },
      { gameDate: day("2026-08-09"), assignments: [{ effectiveDate: day("2026-08-01"), slotId: "slot-1" }] },
    ];

    expect(slotPointTotals(events, day("2026-08-01"), day("2026-08-09")).get("slot-1")).toBe(1);
  });
});
