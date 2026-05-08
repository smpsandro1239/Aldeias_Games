import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Middleware for error handling
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error(`Prisma error in ${params.model}.${params.action}:`, error);
    throw error;
  }
});

export default prisma;
