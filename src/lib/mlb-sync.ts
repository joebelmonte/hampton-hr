import { gamePlayByPlay, todaysSchedule } from "@/lib/mlb";
import { prisma } from "@/lib/prisma";
import { rebuildSlotTotal } from "@/lib/roster";
import { saveStandingsSnapshot } from "@/lib/standings";

type HomeRun = { mlbPlayerId: number; fullName: string; gameId: number; gameDate: Date; inning: number; hrNumberInGame: number };

const dateString = (date: Date) => date.toISOString().slice(0, 10);
const startOfDay = (date: Date) => new Date(`${dateString(date)}T00:00:00.000Z`);

function homeRunsFromPlayByPlay(gameId: number, gameDate: Date, payload: { allPlays?: unknown[] }): HomeRun[] {
  const homersByPlayer = new Map<number, number>();
  const homeRuns: HomeRun[] = [];
  for (const play of payload.allPlays ?? []) {
    const record = play as { result?: { eventType?: string }; matchup?: { batter?: { id?: number; fullName?: string } }; about?: { inning?: number } };
    if (record.result?.eventType !== "home_run") continue;
    const playerId = record.matchup?.batter?.id;
    const fullName = record.matchup?.batter?.fullName;
    if (!playerId || !fullName) continue;
    const hrNumberInGame = (homersByPlayer.get(playerId) ?? 0) + 1;
    homersByPlayer.set(playerId, hrNumberInGame);
    homeRuns.push({ mlbPlayerId: playerId, fullName, gameId, gameDate, inning: record.about?.inning ?? 0, hrNumberInGame });
  }
  return homeRuns;
}

async function gamesForDates(dates: Date[]) {
  const schedules = await Promise.all(dates.map((date) => todaysSchedule(dateString(date))));
  const games = schedules.flatMap((schedule) => (schedule.dates ?? []).flatMap((date: { games?: unknown[] }) => date.games ?? [])) as { gamePk?: number; officialDate?: string; status?: { abstractGameState?: string } }[];
  return [...new Map(games.filter((game) => game.gamePk && game.officialDate && ["Live", "Final"].includes(game.status?.abstractGameState ?? "")).map((game) => [game.gamePk!, game])).values()];
}

export async function syncHomeRunsForDates(dates: Date[]) {
  const games = await gamesForDates(dates);
  const runsByGame = await Promise.all(games.map(async (game) => homeRunsFromPlayByPlay(
    game.gamePk!,
    startOfDay(new Date(`${game.officialDate}T00:00:00.000Z`)),
    await gamePlayByPlay(game.gamePk!),
  )));
  const homeRuns = runsByGame.flat();
  if (!homeRuns.length) return { games: games.length, homeRuns: 0, inserted: 0, slotsRefreshed: 0 };

  const players = await Promise.all([...new Map(homeRuns.map((homeRun) => [homeRun.mlbPlayerId, homeRun])).values()].map((homeRun) => prisma.player.upsert({
    where: { mlbPlayerId: homeRun.mlbPlayerId },
    create: { mlbPlayerId: homeRun.mlbPlayerId, fullName: homeRun.fullName },
    update: { fullName: homeRun.fullName },
  })));
  const playerIdByMlbId = new Map(players.map((player) => [player.mlbPlayerId, player.id]));
  const result = await prisma.homeRunEvent.createMany({
    data: homeRuns.map((homeRun) => ({
      playerId: playerIdByMlbId.get(homeRun.mlbPlayerId)!,
      gameId: homeRun.gameId,
      gameDate: homeRun.gameDate,
      inning: homeRun.inning || null,
      hrNumberInGame: homeRun.hrNumberInGame,
    })),
    skipDuplicates: true,
  });

  const assignments = await prisma.playerAssignment.findMany({
    where: { playerId: { in: players.map((player) => player.id) } },
    select: { playerId: true, slotId: true, effectiveDate: true },
    orderBy: { effectiveDate: "asc" },
  });
  const assignmentsByPlayer = new Map<string, typeof assignments>();
  for (const assignment of assignments) assignmentsByPlayer.set(assignment.playerId, [...(assignmentsByPlayer.get(assignment.playerId) ?? []), assignment]);
  const affectedSlots = new Set<string>();
  for (const homeRun of homeRuns) {
    const playerId = playerIdByMlbId.get(homeRun.mlbPlayerId)!;
    const assignment = assignmentsByPlayer.get(playerId)?.findLast((entry) => entry.effectiveDate <= homeRun.gameDate);
    if (assignment?.slotId) affectedSlots.add(assignment.slotId);
  }
  await Promise.all([...affectedSlots].map(rebuildSlotTotal));
  await saveStandingsSnapshot();

  return { games: games.length, homeRuns: homeRuns.length, inserted: result.count, slotsRefreshed: affectedSlots.size };
}

export async function syncRecentHomeRuns() {
  return syncHomeRunsForDates([new Date(), new Date(Date.now() - 86_400_000)]);
}

export async function queueMlbBackfill(start: string, end: string) {
  const startDate = startOfDay(new Date(`${start}T00:00:00.000Z`));
  const endDate = startOfDay(new Date(`${end}T00:00:00.000Z`));
  const today = startOfDay(new Date());
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) throw new Error("Choose a valid date range.");
  if (endDate > today) throw new Error("A backfill cannot include future dates.");
  return prisma.mlbBackfill.create({ data: { startDate, endDate, nextDate: startDate } });
}

export async function processNextMlbBackfillDay() {
  const job = await prisma.mlbBackfill.findFirst({ where: { status: { in: ["PENDING", "RUNNING"] } }, orderBy: { createdAt: "asc" } });
  if (!job) return null;
  const summary = await syncHomeRunsForDates([job.nextDate]);
  const nextDate = new Date(job.nextDate.getTime() + 86_400_000);
  const complete = nextDate > job.endDate;
  await prisma.mlbBackfill.update({
    where: { id: job.id },
    data: complete ? { status: "COMPLETE", completedAt: new Date() } : { status: "RUNNING", nextDate },
  });
  return { id: job.id, date: dateString(job.nextDate), status: complete ? "COMPLETE" : "RUNNING", ...summary };
}

export async function getMlbBackfills() {
  return prisma.mlbBackfill.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
}
