import { prisma } from "@/lib/prisma";
import { rebuildSlotTotal } from "@/lib/roster";
import { saveStandingsSnapshot } from "@/lib/standings";

type PlayerData = { mlbPlayerId: number; fullName: string; active: boolean };
type Bundle = {
  version: 1;
  exportedAt: string;
  teams: { name: string; slug: string; ownerEmail: string; slots: number[] }[];
  players: PlayerData[];
  assignments: { mlbPlayerId: number; teamSlug: string | null; slotNumber: number | null; effectiveDate: string }[];
  transactions: { teamSlug: string; slotNumber: number; playerOutMlbPlayerId: number | null; playerInMlbPlayerId: number; effectiveDate: string; notes: string | null }[];
};

const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Every date must use YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("The import contains an invalid date.");
  return date;
};

export async function exportTransactionBundle(): Promise<Bundle> {
  const [teams, assignments, transactions] = await Promise.all([
    prisma.team.findMany({ include: { slots: { select: { number: true }, orderBy: { number: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.playerAssignment.findMany({ include: { player: true, slot: { include: { team: true } } }, orderBy: [{ effectiveDate: "asc" }, { createdAt: "asc" }] }),
    prisma.rosterTransaction.findMany({ include: { team: true, slot: true, playerIn: true, playerOut: true }, orderBy: [{ effectiveDate: "asc" }, { createdAt: "asc" }] }),
  ]);
  const players = new Map<number, PlayerData>();
  for (const assignment of assignments) players.set(assignment.player.mlbPlayerId, { mlbPlayerId: assignment.player.mlbPlayerId, fullName: assignment.player.fullName, active: assignment.player.active });
  for (const transaction of transactions) {
    players.set(transaction.playerIn.mlbPlayerId, { mlbPlayerId: transaction.playerIn.mlbPlayerId, fullName: transaction.playerIn.fullName, active: transaction.playerIn.active });
    if (transaction.playerOut) players.set(transaction.playerOut.mlbPlayerId, { mlbPlayerId: transaction.playerOut.mlbPlayerId, fullName: transaction.playerOut.fullName, active: transaction.playerOut.active });
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    teams: teams.map((team) => ({ name: team.name, slug: team.slug, ownerEmail: team.ownerEmail, slots: team.slots.map((slot) => slot.number) })),
    players: [...players.values()].sort((a, b) => a.mlbPlayerId - b.mlbPlayerId),
    assignments: assignments.map((assignment) => ({ mlbPlayerId: assignment.player.mlbPlayerId, teamSlug: assignment.slot?.team.slug ?? null, slotNumber: assignment.slot?.number ?? null, effectiveDate: dateValue(assignment.effectiveDate) })),
    transactions: transactions.map((transaction) => ({ teamSlug: transaction.team.slug, slotNumber: transaction.slot.number, playerOutMlbPlayerId: transaction.playerOut?.mlbPlayerId ?? null, playerInMlbPlayerId: transaction.playerIn.mlbPlayerId, effectiveDate: dateValue(transaction.effectiveDate), notes: transaction.notes })),
  };
}

function parseBundle(value: unknown): Bundle {
  if (!value || typeof value !== "object") throw new Error("The import file must be a transaction export JSON file.");
  const bundle = value as Partial<Bundle>;
  if (bundle.version !== 1 || !Array.isArray(bundle.teams) || !Array.isArray(bundle.players) || !Array.isArray(bundle.assignments) || !Array.isArray(bundle.transactions)) throw new Error("This is not a supported league export file.");
  const teams = bundle.teams.map((team) => {
    if (typeof team.name !== "string" || !team.name.trim() || typeof team.slug !== "string" || !/^[a-z0-9-]+$/.test(team.slug) || typeof team.ownerEmail !== "string" || !team.ownerEmail.trim() || !Array.isArray(team.slots) || !team.slots.length || team.slots.some((slot) => !Number.isInteger(slot) || slot < 1) || new Set(team.slots).size !== team.slots.length) throw new Error("The import contains an invalid team setup.");
    return { name: team.name.trim(), slug: team.slug, ownerEmail: team.ownerEmail.trim(), slots: [...team.slots].sort((a, b) => a - b) };
  });
  if (new Set(teams.map((team) => team.name)).size !== teams.length || new Set(teams.map((team) => team.slug)).size !== teams.length) throw new Error("The import contains duplicate team names or slugs.");
  const players = bundle.players.map((player) => {
    if (!Number.isInteger(player.mlbPlayerId) || player.mlbPlayerId <= 0 || typeof player.fullName !== "string" || !player.fullName.trim() || typeof player.active !== "boolean") throw new Error("The import contains an invalid player.");
    return { mlbPlayerId: player.mlbPlayerId, fullName: player.fullName.trim(), active: player.active };
  });
  if (new Set(players.map((player) => player.mlbPlayerId)).size !== players.length) throw new Error("The import contains duplicate MLBAM IDs.");
  const playerIds = new Set(players.map((player) => player.mlbPlayerId));
  const assignments = bundle.assignments.map((assignment) => {
    if (!playerIds.has(assignment.mlbPlayerId) || (assignment.teamSlug === null) !== (assignment.slotNumber === null) || (assignment.teamSlug !== null && (typeof assignment.teamSlug !== "string" || !Number.isInteger(assignment.slotNumber)))) throw new Error("The import contains an invalid assignment.");
    return { ...assignment, effectiveDate: dateValue(parseDate(assignment.effectiveDate)) };
  });
  if (new Set(assignments.map((assignment) => `${assignment.mlbPlayerId}:${assignment.effectiveDate}`)).size !== assignments.length) throw new Error("The import contains multiple assignments for a player on one date.");
  const transactions = bundle.transactions.map((transaction) => {
    if (typeof transaction.teamSlug !== "string" || !Number.isInteger(transaction.slotNumber) || !playerIds.has(transaction.playerInMlbPlayerId) || (transaction.playerOutMlbPlayerId !== null && !playerIds.has(transaction.playerOutMlbPlayerId)) || (transaction.notes !== null && typeof transaction.notes !== "string")) throw new Error("The import contains an invalid transaction.");
    return { ...transaction, effectiveDate: dateValue(parseDate(transaction.effectiveDate)) };
  });
  return { version: 1, exportedAt: typeof bundle.exportedAt === "string" ? bundle.exportedAt : new Date().toISOString(), teams, players, assignments, transactions };
}

export async function importTransactionBundle(text: string) {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("The import file is not valid JSON."); }
  const bundle = parseBundle(raw);
  const [existingTeams, existingAssignments, existingTransactions] = await Promise.all([prisma.team.count(), prisma.playerAssignment.count(), prisma.rosterTransaction.count()]);
  if (existingTeams || existingAssignments || existingTransactions) throw new Error("League import only runs against an empty league. Start with a production database that has no teams, assignments, or transactions.");
  const slotKeys = new Set(bundle.teams.flatMap((team) => team.slots.map((slot) => `${team.slug}:${slot}`)));
  for (const assignment of bundle.assignments) if (assignment.teamSlug && !slotKeys.has(`${assignment.teamSlug}:${assignment.slotNumber}`)) throw new Error(`No slot ${assignment.slotNumber} exists for ${assignment.teamSlug} in this export.`);
  for (const transaction of bundle.transactions) if (!slotKeys.has(`${transaction.teamSlug}:${transaction.slotNumber}`)) throw new Error(`No slot ${transaction.slotNumber} exists for ${transaction.teamSlug} in this export.`);

  await prisma.$transaction(async (tx) => {
    await Promise.all(bundle.teams.map((team) => tx.team.create({ data: { name: team.name, slug: team.slug, ownerEmail: team.ownerEmail, slots: { create: team.slots.map((number) => ({ number })) } } })));
    const slots = await tx.slot.findMany({ include: { team: true } });
    const slotByKey = new Map(slots.map((slot) => [`${slot.team.slug}:${slot.number}`, slot]));
    const players = await Promise.all(bundle.players.map((player) => tx.player.upsert({ where: { mlbPlayerId: player.mlbPlayerId }, create: player, update: { fullName: player.fullName, active: player.active } })));
    const playerIdByMlbId = new Map(players.map((player) => [player.mlbPlayerId, player.id]));
    if (bundle.assignments.length) await tx.playerAssignment.createMany({ data: bundle.assignments.map((assignment) => {
      const slot = assignment.teamSlug ? slotByKey.get(`${assignment.teamSlug}:${assignment.slotNumber}`)! : null;
      return { playerId: playerIdByMlbId.get(assignment.mlbPlayerId)!, slotId: slot?.id, teamId: slot?.teamId, effectiveDate: parseDate(assignment.effectiveDate) };
    }) });
    if (bundle.transactions.length) await tx.rosterTransaction.createMany({ data: bundle.transactions.map((transaction) => {
      const slot = slotByKey.get(`${transaction.teamSlug}:${transaction.slotNumber}`)!;
      return { teamId: slot.teamId, slotId: slot.id, playerOutId: transaction.playerOutMlbPlayerId ? playerIdByMlbId.get(transaction.playerOutMlbPlayerId) : null, playerInId: playerIdByMlbId.get(transaction.playerInMlbPlayerId)!, effectiveDate: parseDate(transaction.effectiveDate), notes: transaction.notes };
    }) });
  });
  const slots = await prisma.slot.findMany({ select: { id: true } });
  await Promise.all(slots.map((slot) => rebuildSlotTotal(slot.id)));
  await saveStandingsSnapshot();
  return { transactions: bundle.transactions.length, assignments: bundle.assignments.length };
}
