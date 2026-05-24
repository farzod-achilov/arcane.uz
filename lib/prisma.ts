import { PrismaClient } from '@prisma/client';

// Prisma 7 requires the datasource URL to be passed explicitly to the constructor
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
