import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL must be set to use the league database.");

// Vercel can run several function instances at once. Keep each instance to one
// database connection so their pools cannot exhaust Supabase's client limit.
const adapter = new PrismaPg({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });

/** A single client prevents connection churn during Next.js development reloads. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
