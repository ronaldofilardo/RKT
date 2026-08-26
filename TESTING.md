# Estratégia de testes do RKT

A validação obrigatória do projeto deve ser executada com `pnpm test:strict`. Esse comando roda o typecheck, rejeita `skip` e `only` explícitos e executa o Jest em modo CI e serializado. A cobertura deve ser executada com `pnpm test:coverage`; os arquivos de produção são descobertos automaticamente pelo Jest, enquanto tipos e testes são excluídos explicitamente.

A pipeline exige instalação congelada pelo lockfile, geração do cliente Prisma e schema de teste aplicado antes da suíte. O banco de CI é PostgreSQL isolado por job. Falhas de instalação, geração, schema, typecheck, skips, testes ou cobertura interrompem a pipeline independentemente das demais etapas.

Testes de componentes usam `pnpm test:components`, com `jsdom`. Testes de API e domínio usam o ambiente Node. Testes E2E usam `pnpm test:e2e` e precisam de uma aplicação iniciada e banco de teste configurado. Mutation testing usa `pnpm test:mutation` e deve ser executado separadamente, por ser uma verificação de qualidade adicional e mais lenta.

Todo teste que altera timers, spies, armazenamento, listeners, IndexedDB, EventSource ou BroadcastChannel deve restaurar o recurso no próprio escopo. O setup global restaura spies automaticamente, mas não substitui a responsabilidade do teste de fechar conexões e remover listeners criados manualmente.
