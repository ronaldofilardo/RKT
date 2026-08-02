const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const TEST_DB_URL = 'postgresql://postgres:123456@localhost:5432/racket_mvp_test';

async function setupTestEnvironment() {
  console.log('🔧 Setup do Ambiente de Teste');
  console.log('================================');

  try {
    console.log('\n1. Criando banco de dados de teste se não existir...');
    const { Prisma } = require('@prisma/client');
    const tempClient = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });

    try {
      await tempClient.$connect();
      console.log('   ✓ Banco de teste já existe');
    } catch (err) {
      console.log('   📦 Criando banco racket_mvp_test...');
      execSync('psql -U postgres -c "CREATE DATABASE racket_mvp_test;" -h localhost', {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: '123456' }
      });
      console.log('   ✓ Banco criado com sucesso');
    } finally {
      await tempClient.$disconnect();
    }

    console.log('\n2. Sincronizando schema com banco de teste...');
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DB_URL }
    });

    console.log('\n✅ Ambiente de teste preparado com sucesso!');
    console.log('   Execute: pnpm test');
  } catch (error) {
    console.error('\n❌ Erro no setup do ambiente de teste:', error.message);
    process.exit(1);
  }
}

setupTestEnvironment();