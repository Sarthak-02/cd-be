import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton
 * Prevents exhausting DB connections in:
 * - Cloud Run
 * - hot reload
 * - worker retries
 */

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

