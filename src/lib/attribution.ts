export type DatedAssignment = { effectiveDate: Date; slotId: string | null };
export type HomeRunForAttribution = { gameDate: Date; assignments: DatedAssignment[] };

/** Returns the player's most recent roster assignment in effect when the game began. */
export function assignmentForGame(assignments: DatedAssignment[], gameDate: Date) {
  return assignments.reduce<DatedAssignment | undefined>((latest, assignment) => {
    if (assignment.effectiveDate > gameDate) return latest;
    return !latest || assignment.effectiveDate > latest.effectiveDate ? assignment : latest;
  }, undefined);
}

/** Attributes home runs to slots, optionally within a half-open date window. */
export function slotPointTotals(events: HomeRunForAttribution[], since?: Date, until?: Date) {
  const totals = new Map<string, number>();
  for (const event of events) {
    if ((since && event.gameDate < since) || (until && event.gameDate >= until)) continue;
    const assignment = assignmentForGame(event.assignments, event.gameDate);
    if (assignment?.slotId) totals.set(assignment.slotId, (totals.get(assignment.slotId) ?? 0) + 1);
  }
  return totals;
}
