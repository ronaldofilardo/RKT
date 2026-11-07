/**
 * Validação de destino do banco — entry point público (guarda P-01).
 * Orquestra parsing + asserções por ambiente.
 */

import type { DbTarget } from './db-target';
import { resolveDbEnv } from './db-target';
import { parseDatabaseUrl, readDatabaseUrl } from './db-target.parse';
import { assertDevelopmentTarget, assertTestTarget, assertProductionTarget } from './db-target.assert';

/**
 * Valida o destino do banco para o ambiente corrente e devolve o alvo já normalizado.
 * Lança DbTargetError quando a premissa P-01 é violada.
 */
export function validateDbTarget(env: NodeJS.ProcessEnv = process.env): DbTarget {
  const envName = resolveDbEnv(env);
  const url = readDatabaseUrl(env, envName);
  const { host, database } = parseDatabaseUrl(url);

  if (envName === 'development') assertDevelopmentTarget(host, database);
  else if (envName === 'test') assertTestTarget(host, database);
  else assertProductionTarget(host, database);

  return { env: envName, url, host, database };
}

/** Alias para compatibilidade com código existente. */
export const assertDbTarget = validateDbTarget;