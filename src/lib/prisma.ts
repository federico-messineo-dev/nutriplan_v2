import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In production on Vercel without Postgres, use mock data
const isMockMode = process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.startsWith("postgres");

function initPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  if (isMockMode) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mock = require("./mock-data");
    return mock.createMockPrisma() as unknown as PrismaClient;
  }

  return new PrismaClient();
}

export const prisma = initPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
