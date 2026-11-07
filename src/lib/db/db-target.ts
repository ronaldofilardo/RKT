/**
 * Guarda de destino do banco de dados — premissa P-01 (docs/RULES.md).
 *
 * Regra inquebrável:
 *  - development: somente banco local `racket_mvp` (loopback)
 *  - test:        somente banco local `racket_mvp_test` (loopback)
 *  - production:  somente banco do Neon (*.neon.tech)
 *
 * Nenhum processo local pode apontar para o Neon. A violação falha rápido
 * (DbTargetError) em vez de cair em um fallback silencioso.
 */

export type DbEnv = 'development' | 'test' | 'production';

export type DbTargetErrorCode =
  | 'MISSING_DATABASE_URL'
  | 'INVALID_DATABASE_URL'
  | 'INVALID_DB_TARGET'
  | 'DEV_TARGET_MUST_BE_LOCAL'
  | 'DEV_TARGET_WRONG_DATABASE'
  | 'TEST_TARGET_MUST_BE_LOCAL'
  | 'TEST_TARGET_WRONG_DATABASE'
  | 'PROD_TARGET_MUST_BE_NEON'
  | 'PROD_TARGET_WRONG_DATABASE';

export interface DbTarget {
  env: DbEnv;
  url: string;
  host: string;
  database: string;
}

export const DEV_DATABASE_NAME = 'racket_mvp';
export const TEST_DATABASE_NAME = 'racket_mvp_test';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const NEON_HOST_SUFFIX = '.neon.tech';
const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

/** Cada ambiente tem a sua variável: nenhuma credencial é compartilhada entre eles. */
export const DATABASE_URL_VARIABLE: Record<DbEnv, string> = {
  development: 'DATABASE_URL_DEV',
  test: 'DATABASE_URL_TEST',
  production: 'DATABASE_URL',
};

export class DbTargetError extends Error {
  readonly code: DbTargetErrorCode;

  constructor(code: DbTargetErrorCode, message: string) {
    super(message);
    this.name = 'DbTargetError';
    this.code = code;
  }
}

/**
 * Valores permitidos em `DB_TARGET`: o seletor explícito usado pelo pré-voo para
 * processos que rodam com NODE_ENV de desenvolvimento mas devem usar o banco de
 * teste (servidor do Playwright). `production` NUNCA é aceito aqui — produção só
 * é reconhecida pelos marcadores de deploy, o que impede um dev local de apontar
 * para o Neon por engano.
 */
const DB_TARGET_OVERRIDES = new Set(['development', 'test']);

/**
 * `production` exige marcador explícito de deploy (Vercel ou APP_ENV=production).
 * Sem o marcador, um `next start`/`next build` local continua sendo development —
 * e portanto continua proibido de tocar no Neon.
 */
export function resolveDbEnv(env: NodeJS.ProcessEnv = process.env): DbEnv {
  const override = env.DB_TARGET?.trim();
  if (override) {
    if (!DB_TARGET_OVERRIDES.has(override)) {
      throw new DbTargetError(
        'INVALID_DB_TARGET',
        `[db] DB_TARGET inválido: "${override}". Valores aceitos: development, test.`,
      );
    }
    return override as DbEnv;
  }

  if (env.NODE_ENV === 'test') return 'test';

  const isDeployed = env.VERCEL === '1' || env.APP_ENV === 'production';
  if (env.NODE_ENV === 'production' && isDeployed) return 'production';

  return 'development';
}

function readDatabaseUrl(env: NodeJS.ProcessEnv, envName: DbEnv): string {
  const variable = DATABASE_URL_VARIABLE[envName];
  const url = env[variable];

  if (typeof url !== 'string' || url.trim() === '') {
    const file = envName === 'test' ? '.env.test' : envName === 'development' ? '.env' : 'painel da Vercel/Neon';
    throw new DbTargetError(
      'MISSING_DATABASE_URL',
      `[db] ${variable} não está definida para o ambiente ${envName}. Defina-a em ${file}.`,
    );
  }

  return url.trim();
}

function parseDatabaseUrl(url: string): { host: string; database: string } {
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

  // Host vazio em URLs postgres equivale ao host padrão do driver (loopback).
  const host = (parsed.hostname || 'localhost').toLowerCase();
  return { host, database };
}

function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host);
}

function isNeonHost(host: string): boolean {
  return host.endsWith(NEON_HOST_SUFFIX);
}

function assertDevelopmentTarget(host: string, database: string): void {
  if (!isLoopbackHost(host)) {
    throw new DbTargetError(
      'DEV_TARGET_MUST_BE_LOCAL',
      `[db] BLOQUEADO: ambiente development exige banco local, mas o destino é "${host}/${database}". ` +
        `Desenvolvimento NUNCA pode usar o banco de produção. Aponte DATABASE_URL_DEV para localhost:5432/${DEV_DATABASE_NAME}.`,
    );
  }

  if (database !== DEV_DATABASE_NAME) {
    throw new DbTargetError(
      'DEV_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente development exige o banco "${DEV_DATABASE_NAME}", mas o destino é "${host}/${database}".`,
    );
  }
}

function assertTestTarget(host: string, database: string): void {
  if (!isLoopbackHost(host)) {
    throw new DbTargetError(
      'TEST_TARGET_MUST_BE_LOCAL',
      `[db] BLOQUEADO: ambiente test exige banco local, mas o destino é "${host}/${database}". ` +
        `Testes rodam somente no banco "${TEST_DATABASE_NAME}" em localhost.`,
    );
  }

  if (database !== TEST_DATABASE_NAME) {
    throw new DbTargetError(
      'TEST_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente test exige o banco "${TEST_DATABASE_NAME}", mas o destino é "${host}/${database}". ` +
        `Testes nunca usam o banco de desenvolvimento ou de produção.`,
    );
  }
}

function assertProductionTarget(host: string, database: string): void {
  if (!isNeonHost(host)) {
    throw new DbTargetError(
      'PROD_TARGET_MUST_BE_NEON',
      `[db] BLOQUEADO: ambiente production exige o banco do Neon (host terminando em "${NEON_HOST_SUFFIX}"), ` +
        `mas o destino é "${host}/${database}".`,
    );
  }

  if (database === DEV_DATABASE_NAME || database === TEST_DATABASE_NAME) {
    throw new DbTargetError(
      'PROD_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente production não pode usar o banco "${database}".`,
    );
  }
}

/**
 * Valida o destino do banco para o ambiente corrente e devolve o alvo já normalizado.
 * Lança DbTargetError quando a premissa P-01 é violada.
 */
export function assertDbTarget(env: NodeJS.ProcessEnv = process.env): DbTarget {
  const envName = resolveDbEnv(env);
  const url = readDatabaseUrl(env, envName);
  const { host, database } = parseDatabaseUrl(url);

  if (envName === 'development') assertDevelopmentTarget(host, database);
  else if (envName === 'test') assertTestTarget(host, database);
  else assertProductionTarget(host, database);

  return { env: envName, url, host, database };
}

/** Resumo seguro para logs: contém host e banco, nunca credenciais. */
export function describeDbTarget(target: DbTarget): string {
  return `${target.env} → ${target.host}/${target.database}`;
}
