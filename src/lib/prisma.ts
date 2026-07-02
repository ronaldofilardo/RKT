import { PrismaClient } from '@prisma/client';
import { getRLSUser } from './rls-context';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

prisma.$use(async (params, next) => {
  const user = getRLSUser();
  if (user) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_user_role', $2, true)`,
        user.id,
        user.role,
      );
    } catch {
      // RLS context is best-effort — queries still work without it
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
