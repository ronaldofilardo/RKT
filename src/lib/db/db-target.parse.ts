/**
 * Parsing e leitura de DATABASE_URL — utilitários de baixo nível.
 */

import type { DbEnv } from './db-target';
import {
  DbTargetError,
  POSTGRES_PROTOCOLS,
  DATABASE_URL_VARIABLE,
  LOOPBACK_HOSTS,
  NEON_HOST_SUFFIX,
} from './db-target';

export function parseDatabaseUrl(url: string): { host: string; database: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DbTargetError('INVALID_DATABASE_URL', '[db] DATABASE_URL inválida: não é uma URL de conexão válida.');
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new DbTargetError(
      'INVALID_DATABASE_URL',
      `[db] DATABASE_URL inválida: protocolo "${parsed.protocol}" não é PostgreSQL.`,
    );
  }

  let database: string;
  try {
    database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  } catch {
    throw new DbTargetError('INVALID_DATABASE_URL', '[db] DATABASE_URL inválida: nome do banco mal codificado.');
  }

  if (!database) {
    throw new DbTargetError('INVALID_DATABASE_URL', '[db] DATABASE_URL inválida: nenhum nome de banco informado.');
  }

  const host = (parsed.hostname || 'localhost').toLowerCase();
  return { host, database };
}

export function readDatabaseUrl(env: NodeJS.ProcessEnv, envName: DbEnv): string {
  const variable = DATABASE_URL_VARIABLE[envName];
  let url = env[variable];

  // Em produção na Vercel/Neon, aceita fallbacks fornecidos pela integração (POSTGRES_PRISMA_URL, POSTGRES_URL)
  if (envName === 'production' && (!url || url.trim() === '')) {
    url = env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || env.POSTGRES_URL_NON_POOLING;
  }

  if (typeof url !== 'string' || url.trim() === '') {
    const file = envName === 'test' ? '.env.test' : envName === 'development' ? '.env' : 'painel da Vercel/Neon';
    throw new DbTargetError(
      'MISSING_DATABASE_URL',
      `[db] ${variable} não está definida para o ambiente ${envName}. Defina-a em ${file}.`,
    );
  }

  return url.trim();
}

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host);
}

export function isNeonHost(host: string): boolean {
  return host.endsWith(NEON_HOST_SUFFIX);
}