import { teamScore } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { slotPointTotals } from "@/lib/attribution";
import { startOfLeagueDay } from "@/lib/league-date";

export type Standing = {
  id: string;
  slug: string;
  name: string;
  rank: number;
  movement: number;
  total: number;
  today: number;
  yesterday: number;
  pastSevenDays: number;
  pastThirtyDays: number;
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

const slotPoints = (events: { gameDate: Date; player: { assignments: { effectiveDate: Date; slotId: string | null }[] } }[], since?: Date, until?: Date) => slotPointTotals(events.map((event) => ({ gameDate: event.gameDate, assignments: event.player.assignments })), since, until);

function scoreForSlots(slotIds: string[], points: Map<string, number>) {
  return teamScore(slotIds.map((slotId) => ({ slotId, homeRuns: points.get(slotId) ?? 0 })));
}

/**
 * Calculates every displayed value from event history, rather than from a
 * presentation-only snapshot. Snapshot records are used only for rank movement.
 */
export async function getStandings(asOf = new Date()): Promise<Standing[]> {
  const day = startOfLeagueDay(asOf);
  const [teams, events, previousSnapshot] = await Promise.all([
    prisma.team.findMany({ include: { slots: { select: { id: true } } }, orderBy: { name: "asc" } }),
    prisma.homeRunEvent.findMany({
      where: { gameDate: { lte: day } },
      select: {
        gameDate: true,
        player: { select: { assignments: { where: { effectiveDate: { lte: day } }, orderBy: { effectiveDate: "desc" }, select: { effectiveDate: true, slotId: true } } } },
      },
    }),
    prisma.standingsSnapshot.findMany({
      where: { asOfDate: { lt: day } },
      orderBy: { asOfDate: "desc" },
      distinct: ["teamId"],
      select: { teamId: true, rank: true },
    }),
  ]);

  const allPoints = slotPoints(events);
  const todayPoints = slotPoints(events, day);
  const yesterdayPoints = slotPoints(events, addDays(day, -1), day);
  const pastSevenDayPoints = slotPoints(events, addDays(day, -7), day);
  const pastThirtyDayPoints = slotPoints(events, addDays(day, -30), day);
  const previousRanks = new Map(previousSnapshot.map((snapshot) => [snapshot.teamId, snapshot.rank]));

  return teams
    .map((team) => {
      const slotIds = team.slots.map((slot) => slot.id);
      return {
        id: team.id,
        slug: team.slug,
        name: team.name,
        total: scoreForSlots(slotIds, allPoints),
        today: scoreForSlots(slotIds, todayPoints),
        yesterday: scoreForSlots(slotIds, yesterdayPoints),
        pastSevenDays: scoreForSlots(slotIds, pastSevenDayPoints),
        pastThirtyDays: scoreForSlots(slotIds, pastThirtyDayPoints),
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .map((standing, index) => ({
      ...standing,
      rank: index + 1,
      movement: (previousRanks.get(standing.id) ?? index + 1) - (index + 1),
    }));
}

export async function saveStandingsSnapshot(asOf = new Date()) {
  const day = startOfLeagueDay(asOf);
  const standings = await getStandings(asOf);
  await prisma.$transaction(standings.map((standing) => prisma.standingsSnapshot.upsert({
    where: { teamId_asOfDate: { teamId: standing.id, asOfDate: day } },
    create: { teamId: standing.id, asOfDate: day, teamPoints: standing.total, rank: standing.rank },
    update: { teamPoints: standing.total, rank: standing.rank },
  })));
  return standings;
}

export async function getLeagueTeams() {
  return prisma.team.findMany({ select: { id: true, name: true, slug: true, slots: { select: { id: true, number: true }, orderBy: { number: "asc" } } }, orderBy: { name: "asc" } });
}

export async function getMlbStatsLastUpdated() {
  return (await prisma.mlbSyncState.findUnique({ where: { id: "home-runs" }, select: { updatedAt: true } }))?.updatedAt ?? null;
}

export async function getTransactions() {
  return prisma.rosterTransaction.findMany({
    include: { team: true, slot: true, playerIn: true, playerOut: true },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTeamDetail(slug: string, asOf = new Date()) {
  const day = startOfLeagueDay(asOf);
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      slots: { include: { cachedTotal: true }, orderBy: { number: "asc" } },
      transactions: { include: { playerIn: true, playerOut: true, slot: true }, orderBy: { effectiveDate: "desc" } },
    },
  });
  if (!team) return null;

  const slotIds = team.slots.map((slot) => slot.id);
  const [events, slotAssignments] = await Promise.all([
    prisma.homeRunEvent.findMany({ where: { gameDate: { lte: day }, player: { assignments: { some: { slotId: { in: slotIds } } } } }, select: { playerId: true, gameDate: true, player: { select: { assignments: { where: { effectiveDate: { lte: day } }, orderBy: { effectiveDate: "desc" }, select: { effectiveDate: true, slotId: true } } } } } }),
    prisma.playerAssignment.findMany({ where: { slotId: { in: slotIds }, effectiveDate: { lte: day } }, include: { player: true }, orderBy: { effectiveDate: "asc" } }),
  ]);
  const assignments = await prisma.playerAssignment.findMany({
    where: { playerId: { in: slotAssignments.map((assignment) => assignment.playerId) }, effectiveDate: { lte: day } },
    include: { player: true },
    orderBy: { effectiveDate: "asc" },
  });
  const points = slotPoints(events);
  const currentAssignmentByPlayer = new Map<string, string | null>();
  const assignmentsByPlayer = new Map<string, typeof assignments>();
  const eventsByPlayer = new Map<string, typeof events>();
  for (const assignment of assignments) {
    currentAssignmentByPlayer.set(assignment.playerId, assignment.slotId);
    assignmentsByPlayer.set(assignment.playerId, [...(assignmentsByPlayer.get(assignment.playerId) ?? []), assignment]);
  }
  for (const event of events) eventsByPlayer.set(event.playerId, [...(eventsByPlayer.get(event.playerId) ?? []), event]);

  return {
    ...team,
    total: scoreForSlots(slotIds, points),
    slots: team.slots.map((slot) => ({
      ...slot,
      total: points.get(slot.id) ?? 0,
      players: slotAssignments.filter((assignment) => assignment.slotId === slot.id).map((assignment) => {
        const history = assignmentsByPlayer.get(assignment.playerId) ?? [];
        const nextAssignment = history.find((entry) => entry.effectiveDate > assignment.effectiveDate);
        const endDate = nextAssignment ? new Date(nextAssignment.effectiveDate.getTime() - 86_400_000) : null;
        return {
          id: assignment.id,
          name: assignment.player.fullName,
          startDate: assignment.effectiveDate,
          endDate,
          current: currentAssignmentByPlayer.get(assignment.playerId) === slot.id,
          homeRuns: (eventsByPlayer.get(assignment.playerId) ?? []).filter((event) => event.gameDate >= assignment.effectiveDate && (!endDate || event.gameDate <= endDate)).length,
        };
      }).sort((a, b) => Number(b.current) - Number(a.current) || b.startDate.getTime() - a.startDate.getTime()),
    })).sort((a, b) => b.total - a.total || a.number - b.number),
  };
}
