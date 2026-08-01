/** Source of truth is HomeRunEvent + PlayerAssignment. SlotTotal is disposable cache. */
export type SlotScore = { slotId: string; homeRuns: number };
export function teamScore(slotScores: SlotScore[]): number { return [...slotScores].sort((a, b) => b.homeRuns - a.homeRuns).slice(0, 10).reduce((sum, slot) => sum + slot.homeRuns, 0); }
export function assignmentIsActive(effectiveDate: Date, gameDate: Date) { return effectiveDate <= gameDate; }
