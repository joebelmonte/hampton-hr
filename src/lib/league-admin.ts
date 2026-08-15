import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) throw new Error("Enter a team name containing letters or numbers.");
  return slug;
}

export async function getLeagueAdminTeams() {
  return prisma.team.findMany({
    include: { slots: { include: { cachedTotal: true, _count: { select: { assignments: true } } }, orderBy: { number: "asc" } }, _count: { select: { assignments: true, transactions: true, standings: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createLeagueTeam(input: { name: string; ownerEmail: string }) {
  const name = input.name.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  if (!name) throw new Error("Enter a team name.");
  if (!/^\S+@\S+\.\S+$/.test(ownerEmail)) throw new Error("Enter a valid captain email address.");
  return prisma.team.create({ data: { name, slug: slugify(name), ownerEmail, slots: { create: Array.from({ length: 14 }, (_, index) => ({ number: index + 1 })) } } });
}

export async function updateLeagueTeam(input: { id: string; name: string; ownerEmail: string }) {
  const name = input.name.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  if (!name) throw new Error("Enter a team name.");
  if (!/^\S+@\S+\.\S+$/.test(ownerEmail)) throw new Error("Enter a valid captain email address.");
  return prisma.team.update({ where: { id: input.id }, data: { name, ownerEmail } });
}

export async function deleteLeagueTeam(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { slots: { include: { cachedTotal: true, _count: { select: { assignments: true } } }, orderBy: { number: "asc" } }, _count: { select: { assignments: true, transactions: true, standings: true } } },
  });
  if (!team) throw new Error("This team no longer exists.");
  const hasHistory = team._count.assignments || team._count.transactions || team._count.standings || team.slots.some((slot) => slot._count.assignments || (slot.cachedTotal?.totalHomeRuns ?? 0) > 0);
  if (hasHistory) throw new Error("This team has roster, transaction, standings, or scoring history and cannot be deleted.");
  await prisma.team.delete({ where: { id: team.id } });
}
