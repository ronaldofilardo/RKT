// Prepara o banco de teste (cria se faltar + sincroniza o schema).
// Uso: pnpm test:setup   (o pré-voo P-01 carrega .env.test e valida o destino)
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const TEST_DATABASE_NAME = 'racket_mvp_test';

function readTestTarget() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error('[db] DATABASE_URL ausente. Rode via "pnpm test:setup" (pré-voo P-01).');
    process.exit(1);
  }

  const url = new URL(raw);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const host = (url.hostname || 'localhost').toLowerCase();

  if (!LOOPBACK.has(host) || database !== TEST_DATABASE_NAME) {
    console.error(`[db] BLOQUEADO: banco de teste deve ser localhost/${TEST_DATABASE_NAME}, recebido "${host}/${database}".`);
    process.exit(1);
  }

  return { raw, database, host, url };
}

async function setupTestEnvironment() {
  const target = readTestTarget();

  console.log('🔧 Setup do Ambiente de Teste');
  console.log('================================');
  console.log(`   Alvo: ${target.host}/${target.database}`);

  const tempClient = new PrismaClient({ datasources: { db: { url: target.raw } } });

  try {
    console.log('\n1. Verificando se o banco de teste existe...');
    try {
      await tempClient.$connect();
      console.log('   ✓ Banco de teste já existe');
    } catch {
      console.log(`   📦 Criando banco ${target.database}...`);
      execSync(
        `psql -U ${decodeURIComponent(target.url.username) || 'postgres'} -h ${target.host} -p ${target.url.port || '5432'} -c "CREATE DATABASE ${target.database};"`,
        {
          stdio: 'inherit',
          env: { ...process.env, PGPASSWORD: decodeURIComponent(target.url.password) },
        },
      );
      console.log('   ✓ Banco criado com sucesso');
    }

    console.log('\n2. Sincronizando schema com banco de teste...');
    execSync('prisma db push --skip-generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: target.raw },
    });

    console.log('\n✅ Ambiente de teste preparado com sucesso!');
    console.log('   Execute: pnpm test');
  } catch (error) {
    console.error('\n❌ Erro no setup do ambiente de teste:', error.message);
    process.exit(1);
  } finally {
    await tempClient.$disconnect().catch(() => {});
  }
}

setupTestEnvironment();
