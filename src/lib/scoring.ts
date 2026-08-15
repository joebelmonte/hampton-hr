/** Source of truth is HomeRunEvent + PlayerAssignment. SlotTotal is disposable cache. */
export type SlotScore = { slotId: string; homeRuns: number };
/** A team has 14 slots; its 12 highest totals count toward the standings. */
export function teamScore(slotScores: SlotScore[]): number { return [...slotScores].sort((a, b) => b.homeRuns - a.homeRuns).slice(0, 12).reduce((sum, slot) => sum + slot.homeRuns, 0); }
export function assignmentIsActive(effectiveDate: Date, gameDate: Date) { return effectiveDate <= gameDate; }
