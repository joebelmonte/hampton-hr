import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL must be set before upgrading roster slots.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  await Promise.all(teams.flatMap((team) => [13, 14].map((number) => prisma.slot.upsert({
    where: { teamId_number: { teamId: team.id, number } },
    create: { teamId: team.id, number },
    update: {},
  }))));
  console.log(`Ensured slots 13 and 14 for ${teams.length} team${teams.length === 1 ? "" : "s"}.`);
}

main().finally(() => prisma.$disconnect());
