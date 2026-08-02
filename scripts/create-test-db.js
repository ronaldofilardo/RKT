const { execSync } = require('child_process');

const TEST_DB_URL = 'postgresql://postgres:123456@localhost:5432/racket_mvp_test';

function createTestDatabase() {
  console.log('📦 Criando banco de dados de teste...');

  try {
    execSync('psql -U postgres -c "DROP DATABASE IF EXISTS racket_mvp_test;" -h localhost', {
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: '123456' }
    });

    execSync('psql -U postgres -c "CREATE DATABASE racket_mvp_test;" -h localhost', {
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: '123456' }
    });

    console.log('✅ Banco racket_mvp_test criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar banco de teste:', error.message);
    process.exit(1);
  }
}

createTestDatabase();