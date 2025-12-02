import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const shouldInitClient = Boolean(process.env.DATABASE_URL);

export const db =
  globalForPrisma.prisma ||
  (shouldInitClient
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
      })
    : ({} as PrismaClient));

if (process.env.NODE_ENV !== "production" && shouldInitClient) globalForPrisma.prisma = db;
