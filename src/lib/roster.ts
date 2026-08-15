import { prisma } from "@/lib/prisma";

const startOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid effective date.");
  return date;
};

export async function rebuildSlotTotal(slotId: string) {
  const events = await prisma.homeRunEvent.findMany({
    where: { player: { assignments: { some: { slotId } } } },
    select: { gameDate: true, player: { select: { assignments: { orderBy: { effectiveDate: "asc" }, select: { effectiveDate: true, slotId: true } } } } },
  });
  const totalHomeRuns = events.reduce((total, event) => {
    const assignment = event.player.assignments.findLast((entry) => entry.effectiveDate <= event.gameDate);
    return total + Number(assignment?.slotId === slotId);
  }, 0);
  await prisma.slotTotal.upsert({
    where: { slotId },
    create: { slotId, totalHomeRuns },
    update: { totalHomeRuns },
  });
}

async function currentPlayerInSlot(slotId: string, effectiveDate: Date) {
  const slotAssignments = await prisma.playerAssignment.findMany({
    where: { slotId, effectiveDate: { lte: effectiveDate } },
    select: { playerId: true },
    distinct: ["playerId"],
  });
  if (!slotAssignments.length) return null;

  const history = await prisma.playerAssignment.findMany({
    where: { playerId: { in: slotAssignments.map((assignment) => assignment.playerId) }, effectiveDate: { lte: effectiveDate } },
    orderBy: { effectiveDate: "desc" },
  });
  const currentByPlayer = new Map<string, typeof history[number]>();
  for (const assignment of history) {
    if (!currentByPlayer.has(assignment.playerId)) currentByPlayer.set(assignment.playerId, assignment);
  }
  return [...currentByPlayer.values()].find((assignment) => assignment.slotId === slotId) ?? null;
}

export async function replacePlayer(input: {
  slotId: string;
  mlbPlayerId: number;
  fullName: string;
  active: boolean;
  effectiveDate: string;
  notes?: string;
}) {
  const effectiveDate = startOfDay(input.effectiveDate);
  const fullName = input.fullName.trim();
  if (!Number.isInteger(input.mlbPlayerId) || input.mlbPlayerId <= 0) throw new Error("Enter a valid MLB player ID.");
  if (!fullName) throw new Error("Enter the incoming player's name.");

  const slot = await prisma.slot.findUnique({ include: { team: true }, where: { id: input.slotId } });
  if (!slot) throw new Error("The selected slot no longer exists.");

  const [outgoingAssignment, existingIncoming] = await Promise.all([
    currentPlayerInSlot(slot.id, effectiveDate),
    prisma.player.findUnique({ where: { mlbPlayerId: input.mlbPlayerId } }),
  ]);

  const incomingAssignment = existingIncoming && await prisma.playerAssignment.findFirst({ where: { playerId: existingIncoming.id, effectiveDate: { lte: effectiveDate } }, orderBy: { effectiveDate: "desc" } });
  if (incomingAssignment?.slotId && incomingAssignment.slotId !== slot.id) {
    throw new Error(`${existingIncoming?.fullName} is already assigned to another roster slot on that date.`);
  }
  if (outgoingAssignment && existingIncoming && outgoingAssignment.playerId === existingIncoming.id) {
    throw new Error(`${existingIncoming.fullName} already occupies this slot on that date. Enter a different MLB player ID to make a replacement.`);
  }

  const incoming = await prisma.$transaction(async (tx) => {
    const incoming = await tx.player.upsert({
      where: { mlbPlayerId: input.mlbPlayerId },
      create: { mlbPlayerId: input.mlbPlayerId, fullName, active: input.active },
      update: { fullName, active: input.active },
    });
    if (outgoingAssignment) {
      await tx.playerAssignment.upsert({
        where: { playerId_effectiveDate: { playerId: outgoingAssignment.playerId, effectiveDate } },
        create: { playerId: outgoingAssignment.playerId, effectiveDate },
        update: { slotId: null, teamId: null },
      });
    }
    await tx.playerAssignment.upsert({
      where: { playerId_effectiveDate: { playerId: incoming.id, effectiveDate } },
      create: { playerId: incoming.id, slotId: slot.id, teamId: slot.teamId, effectiveDate },
      update: { slotId: slot.id, teamId: slot.teamId },
    });
    await tx.rosterTransaction.create({
      data: {
        teamId: slot.teamId,
        slotId: slot.id,
        playerOutId: outgoingAssignment?.playerId,
        playerInId: incoming.id,
        effectiveDate,
        notes: input.notes?.trim() || null,
      },
    });
    return incoming;
  });
  await rebuildSlotTotal(slot.id);

  return { teamSlug: slot.team.slug, playerOutId: outgoingAssignment?.playerId ?? null, playerInId: incoming.id };
}

export async function deleteRosterTransaction(transactionId: string) {
  const transaction = await prisma.rosterTransaction.findUnique({
    where: { id: transactionId },
    include: { team: true },
  });
  if (!transaction) throw new Error("This transaction no longer exists.");

  await prisma.$transaction(async (tx) => {
    await tx.playerAssignment.deleteMany({
      where: { playerId: transaction.playerInId, effectiveDate: transaction.effectiveDate, slotId: transaction.slotId, teamId: transaction.teamId },
    });
    if (transaction.playerOutId) {
      await tx.playerAssignment.deleteMany({
        where: { playerId: transaction.playerOutId, effectiveDate: transaction.effectiveDate, slotId: null, teamId: null },
      });
    }
    await tx.rosterTransaction.delete({ where: { id: transaction.id } });
  });
  await rebuildSlotTotal(transaction.slotId);
  return { teamSlug: transaction.team.slug };
}
