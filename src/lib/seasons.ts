import { prisma } from "@/lib/prisma";

const day = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid season date.");
  return date;
};

export async function getActiveSeason() {
  return prisma.season.findFirst({ where: { status: "ACTIVE" }, orderBy: { year: "desc" } });
}

export async function getSeasonByYear(year: number) {
  return prisma.season.findUnique({ where: { year } });
}

export async function getArchivedSeasons() {
  return prisma.season.findMany({ where: { status: "COMPLETED" }, orderBy: { year: "desc" } });
}

export async function getAllSeasons() {
  return prisma.season.findMany({ orderBy: { year: "desc" } });
}

export async function requireActiveSeason() {
  const season = await getActiveSeason();
  if (!season) throw new Error("There is no active season. Start a new season in League setup.");
  return season;
}

export async function completeActiveSeason(endDate: string) {
  const season = await requireActiveSeason();
  const finalDay = day(endDate);
  if (finalDay < season.startDate) throw new Error("The final date cannot be before the season start date.");
  return prisma.season.update({ where: { id: season.id }, data: { status: "COMPLETED", endDate: finalDay, completedAt: new Date() } });
}

export async function createSeason(input: { year: string; startDate: string }) {
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Enter a valid four-digit season year.");
  const startDate = day(input.startDate);
  const active = await getActiveSeason();
  if (active) throw new Error(`${active.year} is still active. Complete it before starting another season.`);
  return prisma.season.create({ data: { year, startDate } });
}
