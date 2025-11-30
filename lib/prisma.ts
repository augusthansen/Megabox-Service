let PrismaClientClass: typeof import('@prisma/client').PrismaClient;
let prismaInstance: import('@prisma/client').PrismaClient | null = null;

try {
  // Attempt to import Prisma client
  const prismaModule = require('@prisma/client');
  PrismaClientClass = prismaModule.PrismaClient;
} catch {
  console.warn('Prisma client not available. Run "npx prisma generate" to initialize.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: import('@prisma/client').PrismaClient | undefined;
};

function getPrismaClient() {
  if (!PrismaClientClass) {
    console.error('Prisma client not initialized. Database operations will fail.');
    return null;
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    prismaInstance = new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }

    return prismaInstance;
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    return null;
  }
}

export const prisma = getPrismaClient();


