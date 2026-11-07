// Recria o banco de teste (racket_mvp_test). DESTRUTIVO.
// Uso: pnpm db:test:create   (o pré-voo P-01 carrega .env.test e valida o destino)
const { execSync } = require('child_process');

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const TEST_DATABASE_NAME = 'racket_mvp_test';

function readTestTarget() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error('[db] DATABASE_URL ausente. Rode via "pnpm db:test:create" (pré-voo P-01).');
    process.exit(1);
  }

  const url = new URL(raw);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const host = (url.hostname || 'localhost').toLowerCase();

  if (!LOOPBACK.has(host) || database !== TEST_DATABASE_NAME) {
    console.error(`[db] BLOQUEADO: banco de teste deve ser localhost/${TEST_DATABASE_NAME}, recebido "${host}/${database}".`);
    process.exit(1);
  }

  return {
    database,
    psqlArgs: [
      '-U',
      decodeURIComponent(url.username) || 'postgres',
      '-h',
      host,
      '-p',
      url.port || '5432',
    ].join(' '),
    password: decodeURIComponent(url.password),
  };
}

function psql({ psqlArgs, password }, sql) {
  execSync(`psql ${psqlArgs} -c "${sql}"`, {
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: password },
  });
}

function createTestDatabase() {
  const target = readTestTarget();

  console.log(`📦 Recriando o banco de teste ${target.database}...`);

  try {
    psql(target, `DROP DATABASE IF EXISTS ${target.database};`);
    psql(target, `CREATE DATABASE ${target.database};`);
    console.log(`✅ Banco ${target.database} criado com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao criar banco de teste:', error.message);
    process.exit(1);
  }
}

createTestDatabase();
