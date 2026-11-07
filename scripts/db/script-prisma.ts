import { PrismaClient } from '@prisma/client';
import { assertDbTarget, describeDbTarget, type DbEnv, type DbTarget } from '../../src/lib/db/db-target';

/**
 * Acesso ao banco para scripts avulsos — premissa P-01 (docs/RULES.md).
 *
 * Instanciar `new PrismaClient()` direto faria o script herdar qualquer
 * DATABASE_URL do shell. Aqui o alvo passa pela mesma guarda do app e é passado
 * explicitamente ao PrismaClient.
 */
export function scriptDbTarget(requiredEnv?: DbEnv): DbTarget {
  const target = assertDbTarget();

  if (requiredEnv && target.env !== requiredEnv) {
    throw new Error(
      `[db] Este script exige o ambiente ${requiredEnv}, mas o alvo resolvido é ${describeDbTarget(target)}.`,
    );
  }

  console.log(`[db] alvo=${describeDbTarget(target)}`);
  return target;
}

export function createScriptPrisma(requiredEnv?: DbEnv): PrismaClient {
  const target = scriptDbTarget(requiredEnv);
  return new PrismaClient({ datasources: { db: { url: target.url } } });
}
