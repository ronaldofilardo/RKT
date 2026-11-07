import { PrismaClient } from '@prisma/client';
import { assertDbTarget } from './db/db-target';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Premissa P-01 (docs/RULES.md): valida o destino do banco antes de abrir conexão.
// Em development/test exige banco local; em production exige Neon. Falha rápido.
const dbTarget = assertDbTarget();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  datasourceUrl: dbTarget.url,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
