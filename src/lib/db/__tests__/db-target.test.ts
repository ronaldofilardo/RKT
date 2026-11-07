import {
  assertDbTarget,
  DbTargetError,
  DEV_DATABASE_NAME,
  describeDbTarget,
  resolveDbEnv,
  TEST_DATABASE_NAME,
  type DbTargetErrorCode,
} from '@/lib/db/db-target';

const DEV_URL = `postgresql://postgres:senha-local@localhost:5432/${DEV_DATABASE_NAME}`;
const TEST_URL = `postgresql://postgres:senha-local@localhost:5432/${TEST_DATABASE_NAME}`;
const NEON_URL =
  'postgresql://neondb_owner:segredo-de-producao@ep-ancient-shape-acoj70bp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

function expectDbError(env: NodeJS.ProcessEnv, code: DbTargetErrorCode): DbTargetError {
  try {
    assertDbTarget(env);
  } catch (error) {
    expect(error).toBeInstanceOf(DbTargetError);
    const dbError = error as DbTargetError;
    expect(dbError.code).toBe(code);
    return dbError;
  }
  throw new Error(`Esperava DbTargetError ${code}, mas a validação passou.`);
}

describe('resolveDbEnv', () => {
  it('trata NODE_ENV=test como ambiente de teste', () => {
    expect(resolveDbEnv({ NODE_ENV: 'test' })).toBe('test');
  });

  it('exige marcador explícito de deploy para reconhecer produção', () => {
    expect(resolveDbEnv({ NODE_ENV: 'production', VERCEL: '1' })).toBe('production');
    expect(resolveDbEnv({ NODE_ENV: 'production', APP_ENV: 'production' })).toBe('production');
    expect(resolveDbEnv({ NODE_ENV: 'production' })).toBe('development');
    expect(resolveDbEnv({})).toBe('development');
  });
});

describe('DB_TARGET explícito (servidor do Playwright)', () => {
  it('roda um processo de desenvolvimento no banco de teste', () => {
    const target = assertDbTarget({ NODE_ENV: 'development', DB_TARGET: 'test', DATABASE_URL_TEST: TEST_URL });
    expect(target.env).toBe('test');
    expect(target.database).toBe(TEST_DATABASE_NAME);
  });

  it('não aceita o banco de produção mesmo com DB_TARGET=test', () => {
    expectDbError(
      { NODE_ENV: 'development', DB_TARGET: 'test', DATABASE_URL_TEST: NEON_URL },
      'TEST_TARGET_MUST_BE_LOCAL',
    );
  });

  it('rejeita DB_TARGET=production — produção só por marcador de deploy', () => {
    expectDbError({ NODE_ENV: 'production', DB_TARGET: 'production', DATABASE_URL: NEON_URL }, 'INVALID_DB_TARGET');
    expectDbError({ DB_TARGET: 'QUALQUER', DATABASE_URL_DEV: DEV_URL }, 'INVALID_DB_TARGET');
  });

  it('DB_TARGET=development exige o banco local de desenvolvimento', () => {
    expect(assertDbTarget({ DB_TARGET: 'development', DATABASE_URL_DEV: DEV_URL }).env).toBe('development');
    expectDbError({ DB_TARGET: 'development', DATABASE_URL_DEV: TEST_URL }, 'DEV_TARGET_WRONG_DATABASE');
  });
});

describe('assertDbTarget em development', () => {
  it.each([
    ['localhost', DEV_URL],
    ['127.0.0.1', DEV_URL.replace('localhost', '127.0.0.1')],
    ['IPv6 ::1', DEV_URL.replace('localhost', '[::1]')],
  ])('aceita %s apontando para o banco de desenvolvimento', (_label, url) => {
    const target = assertDbTarget({ NODE_ENV: 'development', DATABASE_URL_DEV: url });
    expect(target.env).toBe('development');
    expect(target.database).toBe(DEV_DATABASE_NAME);
  });

  it('não aceita DATABASE_URL como atalho no ambiente local', () => {
    expectDbError({ NODE_ENV: 'development', DATABASE_URL: DEV_URL }, 'MISSING_DATABASE_URL');
  });

  it('bloqueia o banco de produção (Neon) no ambiente local', () => {
    const error = expectDbError(
      { NODE_ENV: 'development', DATABASE_URL_DEV: NEON_URL },
      'DEV_TARGET_MUST_BE_LOCAL',
    );
    expect(error.message).toContain('BLOQUEADO');
    expect(error.message).not.toContain('segredo-de-producao');
  });

  it('bloqueia o banco de teste no ambiente local', () => {
    expectDbError({ NODE_ENV: 'development', DATABASE_URL_DEV: TEST_URL }, 'DEV_TARGET_WRONG_DATABASE');
  });

  it('bloqueia qualquer banco local que não seja racket_mvp', () => {
    const url = 'postgresql://postgres:123456@localhost:5432/outro_banco';
    expectDbError({ NODE_ENV: 'development', DATABASE_URL_DEV: url }, 'DEV_TARGET_WRONG_DATABASE');
  });

  it('ignora DATABASE_URL herdada quando DATABASE_URL_DEV está definida', () => {
    const target = assertDbTarget({
      NODE_ENV: 'development',
      DATABASE_URL: NEON_URL,
      DATABASE_URL_DEV: DEV_URL,
    });
    expect(target.database).toBe(DEV_DATABASE_NAME);
    expect(target.host).toBe('localhost');
  });
});

describe('assertDbTarget em test', () => {
  it('aceita o banco local racket_mvp_test', () => {
    const target = assertDbTarget({ NODE_ENV: 'test', DATABASE_URL_TEST: TEST_URL });
    expect(target.env).toBe('test');
    expect(target.database).toBe(TEST_DATABASE_NAME);
  });

  it('não aceita DATABASE_URL como atalho nos testes', () => {
    expectDbError({ NODE_ENV: 'test', DATABASE_URL: TEST_URL }, 'MISSING_DATABASE_URL');
  });

  it('ignora DATABASE_URL herdada quando DATABASE_URL_TEST está definida', () => {
    const target = assertDbTarget({ NODE_ENV: 'test', DATABASE_URL: NEON_URL, DATABASE_URL_TEST: TEST_URL });
    expect(target.database).toBe(TEST_DATABASE_NAME);
  });

  it('bloqueia o banco de desenvolvimento', () => {
    expectDbError({ NODE_ENV: 'test', DATABASE_URL_TEST: DEV_URL }, 'TEST_TARGET_WRONG_DATABASE');
  });

  it('bloqueia o banco de produção', () => {
    expectDbError({ NODE_ENV: 'test', DATABASE_URL_TEST: NEON_URL }, 'TEST_TARGET_MUST_BE_LOCAL');
  });
});

describe('assertDbTarget em production', () => {
  const prodEnv = { NODE_ENV: 'production', VERCEL: '1', DATABASE_URL: NEON_URL };

  it('aceita o banco provisionado no Neon', () => {
    const target = assertDbTarget(prodEnv);
    expect(target.env).toBe('production');
    expect(target.host).toContain('neon.tech');
    expect(target.database).toBe('neondb');
  });

  it('não aceita DATABASE_URL_DEV em produção', () => {
    expectDbError({ ...prodEnv, DATABASE_URL: '', DATABASE_URL_DEV: DEV_URL }, 'MISSING_DATABASE_URL');
  });

  it('bloqueia banco local em produção', () => {
    expectDbError({ ...prodEnv, DATABASE_URL: DEV_URL }, 'PROD_TARGET_MUST_BE_NEON');
  });

  it('bloqueia nome de banco de desenvolvimento/teste em produção', () => {
    const url = NEON_URL.replace('/neondb?', `/${TEST_DATABASE_NAME}?`);
    expectDbError({ ...prodEnv, DATABASE_URL: url }, 'PROD_TARGET_WRONG_DATABASE');
  });

  it('não reconhece produção sem marcador de deploy (start local)', () => {
    const target = assertDbTarget({ NODE_ENV: 'production', DATABASE_URL_DEV: DEV_URL });
    expect(target.env).toBe('development');
  });

  it('bloqueia URL do Neon quando não há marcador de deploy', () => {
    expectDbError({ NODE_ENV: 'production', DATABASE_URL: NEON_URL }, 'MISSING_DATABASE_URL');
  });
});

describe('assertDbTarget — configuração inválida', () => {
  it('exige a variável de URL do banco', () => {
    expectDbError({ NODE_ENV: 'test' }, 'MISSING_DATABASE_URL');
    expectDbError({ NODE_ENV: 'development', DATABASE_URL_DEV: '   ' }, 'MISSING_DATABASE_URL');
  });

  it('rejeita URL malformada, protocolo não-Postgres e banco ausente', () => {
    expectDbError({ NODE_ENV: 'development', DATABASE_URL_DEV: 'nao-e-url' }, 'INVALID_DATABASE_URL');
    expectDbError(
      { NODE_ENV: 'development', DATABASE_URL_DEV: 'mysql://u:p@localhost/racket_mvp' },
      'INVALID_DATABASE_URL',
    );
    expectDbError(
      { NODE_ENV: 'development', DATABASE_URL_DEV: 'postgresql://u:p@localhost:5432/' },
      'INVALID_DATABASE_URL',
    );
  });

  it('normaliza espaços e ignora query string', () => {
    const target = assertDbTarget({
      NODE_ENV: 'development',
      DATABASE_URL_DEV: `  postgresql://postgres:123456@localhost:5432/${DEV_DATABASE_NAME}?schema=public  `,
    });
    expect(target.database).toBe(DEV_DATABASE_NAME);
    expect(target.host).toBe('localhost');
  });
});

describe('describeDbTarget', () => {
  it('mostra ambiente, host e banco sem expor credenciais', () => {
    const target = assertDbTarget({ NODE_ENV: 'development', DATABASE_URL_DEV: DEV_URL });
    const summary = describeDbTarget(target);
    expect(summary).toBe(`development → localhost/${DEV_DATABASE_NAME}`);
    expect(summary).not.toContain('senha-local');
  });
});
