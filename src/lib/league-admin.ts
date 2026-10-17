import { prisma } from "@/lib/prisma";
import { normalizeCaptainEmails } from "@/lib/captain-emails";
import { getActiveSeason, requireActiveSeason } from "@/lib/seasons";

function slugify(name: string) {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) throw new Error("Enter a team name containing letters or numbers.");
  return slug;
}

export async function getLeagueAdminTeams() {
  const season = await getActiveSeason();
  if (!season) return [];
  return prisma.team.findMany({
    where: { seasonId: season.id },
    include: { slots: { include: { cachedTotal: true, _count: { select: { assignments: true } } }, orderBy: { number: "asc" } }, _count: { select: { assignments: true, transactions: true, standings: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createLeagueTeam(input: { name: string; ownerEmail: string }) {
  const season = await requireActiveSeason();
  const name = input.name.trim();
  const ownerEmail = normalizeCaptainEmails(input.ownerEmail);
  if (!name) throw new Error("Enter a team name.");
  return prisma.team.create({ data: { seasonId: season.id, name, slug: slugify(name), ownerEmail, slots: { create: Array.from({ length: 14 }, (_, index) => ({ number: index + 1 })) } } });
}

export async function updateLeagueTeam(input: { id: string; name: string; ownerEmail: string }) {
  const season = await requireActiveSeason();
  const name = input.name.trim();
  const ownerEmail = normalizeCaptainEmails(input.ownerEmail);
  if (!name) throw new Error("Enter a team name.");
  const team = await prisma.team.findFirst({ where: { id: input.id, seasonId: season.id } });
  if (!team) throw new Error("That team is not in the active season.");
  return prisma.team.update({ where: { id: team.id }, data: { name, ownerEmail } });
}

export async function deleteLeagueTeam(teamId: string) {
  const season = await requireActiveSeason();
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { slots: { include: { cachedTotal: true, _count: { select: { assignments: true } } }, orderBy: { number: "asc" } }, _count: { select: { assignments: true, transactions: true, standings: true } } },
  });
  if (!team || team.seasonId !== season.id) throw new Error("This team is not in the active season.");
  const hasHistory = team._count.assignments || team._count.transactions || team._count.standings || team.slots.some((slot) => slot._count.assignments || (slot.cachedTotal?.totalHomeRuns ?? 0) > 0);
  if (hasHistory) throw new Error("This team has roster, transaction, standings, or scoring history and cannot be deleted.");
  await prisma.team.delete({ where: { id: team.id } });
}
