import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL must be set before seeding.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const teams = ["Moonshots", "Bomb Squad", "Yard Goats"];

async function main() {
  await Promise.all(teams.map(async (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const team = await prisma.team.upsert({
      where: { slug },
      create: { name, slug, ownerEmail: `${slug}@example.com` },
      update: { name },
    });
    await Promise.all(Array.from({ length: 14 }, (_, index) => prisma.slot.upsert({
      where: { teamId_number: { teamId: team.id, number: index + 1 } },
      create: { teamId: team.id, number: index + 1 },
      update: {},
    })));
  }));
}

main().finally(() => prisma.$disconnect());
