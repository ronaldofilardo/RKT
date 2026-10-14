import { PrismaClient } from '@prisma/client';
import { getRLSUser } from './rls-context';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

prisma.$use(async (params, next) => {
  if (params.action === 'executeRaw' || params.action === 'queryRaw') {
    return next(params);
  }

  const user = getRLSUser();
  if (user) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_user_role', $2, true)`,
        user.id,
        user.role,
      );
    } catch (error) {
      logger.warn('[PRISMA RLS] Falha ao aplicar contexto RLS via set_config; query segue sem isolamento:', error);
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
