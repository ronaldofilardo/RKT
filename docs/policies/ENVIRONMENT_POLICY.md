# Política de Isolamento de Ambientes

**Owner:** @backend / @qa
**Última atualização:** 2026-07-23

---

## Visão Geral

Este documento define a política de isolamento de ambientes para o projeto rkt, garantindo que testes nunca afetem dados de desenvolvimento ou produção.

## Ambientes Definidos

| Ambiente     | Arquivo `.env`    | Banco de Dados       | Propósito                    |
|--------------|-------------------|----------------------|------------------------------|
| `local`      | `.env.local`      | `racket_mvp`         | Desenvolvimento diário        |
| `test`       | `.env.test`       | `racket_mvp_test`    | Testes unitários/E2E/Mutation|
| `production` | `.env.production` | Neon (cloud)         | Produção                     |

## Regras de Isolamento

### 1. Banco de Dados
- **Desenvolvimento (`racket_mvp`)**: Dados reais do desenvolvedor
- **Teste (`racket_mvp_test`)**: Banco limpo, recriado antes de cada suite de testes
- **Produção (`neondb`)**: Acesso restrito, nunca tocado por scripts de teste

### 2. Arquivos `.env*`
```
.env              # Defaults (commiteado, sem segredos)
.env.local        # Local dev (NÃO commitar - gitignored)
.env.test         # Teste (NÃO commitar - gitignored)
.env.production   # Produção (NÃO commitar - gitignored)
```

### 3. Variáveis Obrigatórias por Ambiente

```bash
# .env.local (desenvolvimento)
DATABASE_URL=postgresql://postgres:123456@localhost:5432/racket_mvp
JWT_SECRET=<dev-secret>

# .env.test (testagem)
DATABASE_URL=postgresql://postgres:123456@localhost:5432/racket_mvp_test
JWT_SECRET=test-secret-for-jest-testing-only

# .env.production (produção)
DATABASE_URL=<neon-connection-string>
JWT_SECRET=<production-secret>
```

## Fluxo de Execução de Testes

```bash
# 1. Setup inicial (uma vez)
pnpm test:setup

# 2. Executar testes (sempre usa .env.test)
pnpm test

# 3. Testes com coverage
pnpm test:coverage

# 4. Testes E2E (Playwright)
pnpm test:e2e

# 5. Testes de mutação (Stryker)
pnpm test:mutation
```

## Scripts Disponíveis

| Script              | Descrição                                    |
|---------------------|----------------------------------------------|
| `pnpm test:setup`   | Prepara o ambiente de teste completo         |
| `pnpm db:test:create` | Recria o banco de teste do zero            |
| `pnpm db:test:push` | Sincroniza schema Prisma com banco de teste |
| `pnpm db:test:seed` | Popula banco de teste com dados de teste    |

## Como Funciona

### Carregamento de Variáveis

1. **dotenv-cli** carrega explicitamente o arquivo `.env.test`
2. **NODE_ENV=test** indica ao Next.js para usar modo de teste
3. **Prisma Client** usa `DATABASE_URL` do ambiente carregado

### Exemplo de Execução

```bash
# Este comando:
dotenv -e .env.test -- jest

# É equivalente a carregar manualmente:
export DATABASE_URL=postgresql://postgres:123456@localhost:5432/racket_mvp_test
export NODE_ENV=test
jest
```

## Regras para Desenvolvedores

### ✅ Permitido
- Rodar `pnpm test:setup` antes da primeira execução de testes
- Modificar `.env.local` para configuração pessoal
- Criar fixtures de teste no banco `racket_mvp_test`

### ❌ Proibido
- Apontar scripts de desenvolvimento para `racket_mvp_test`
- Usar dados de produção em ambiente de teste
- Commitar arquivos `.env.local`, `.env.test`, `.env.production`

## Troubleshooting

### "Database does not exist"
```bash
pnpm test:setup
```

### "Connection refused"
Verifique se o PostgreSQL está rodando:
```bash
psql -U postgres -h localhost -c "SELECT 1"
```

### "Permission denied"
```bash
# Recriar banco
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS racket_mvp_test;"
psql -U postgres -h localhost -c "CREATE DATABASE racket_mvp_test;"
pnpm db:test:push
```

## Histórico de Mudanças

| Data       | Alteração                    |
|------------|------------------------------|
| 2026-07-23 | Criação da política de ambientes isolados |