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

export const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
export const NEON_HOST_SUFFIX = '.neon.tech';
export const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

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

/**
 * Valida o destino do banco para o ambiente corrente e devolve o alvo já normalizado.
 * Lança DbTargetError quando a premissa P-01 é violada.
 * Delegação para validação pura em db-target.validate.ts.
 */
export { validateDbTarget } from './db-target.validate';
export { assertDbTarget } from './db-target.validate';

/** Resumo seguro para logs: contém host e banco, nunca credenciais. */
export function describeDbTarget(target: DbTarget): string {
  return `${target.env} → ${target.host}/${target.database}`;
}