# Fase 1A — Fundação de acesso (PLANO_FUNDACAO_PERFIS_v2, versão sem transmissão)

Este .zip contém **somente arquivos novos/alterados**, com caminhos relativos à raiz do projeto (`bkpRKT`).
**Nenhum teste foi executado** ao gerar este pacote. Descompacte na raiz do projeto, sobrescrevendo.

## Comandos (rode na raiz do projeto, no terminal do VS Code)

```bash
# 1) Regenerar o Prisma Client (obrigatório: o schema ganhou modelos/campos)
pnpm prisma generate

# 2) Tipos
pnpm typecheck

# 3) Testes novos e os legados mais próximos do que foi tocado
pnpm test "core/access" "session-version" "auth-credentials.sv" "jwt-client" "access-handler" "access-actor" "rls-handler" "auth.contract" "auth.test" "auth.permissions" "rbac-boundaries" "middleware" "api/auth"

# 4) Guarda de tamanho (R-03) e suíte estrita completa
pnpm check:r03
pnpm test:strict

# 5) Banco de teste: aplicar o schema novo (os testes novos não precisam de banco, mas os de integração sim)
pnpm db:test:push
```

Aplicar a migração no banco de desenvolvimento (antes de rodar o app):

```bash
pnpm prisma migrate dev          # aplica 20261026000000_add_access_foundation
# se o Prisma acusar "drift", rode: pnpm prisma migrate dev --create-only  e me envie o SQL gerado
```

Depois da migração (e com o app já na versão nova) confira a consistência, somente leitura:

```bash
node scripts/check-access-consistency.mjs
```

## Ordem de deploy (produção/Neon)
1. Aplicar a migração **antes** de publicar o código (o login passa a ler `users.sessionVersion`).
2. Publicar o código.
3. Rodar `node scripts/check-access-consistency.mjs`.

## O que a fase entrega
- `src/core/access/` — núcleo puro: `can()`, matriz perfil×permissão como dados, escopos (ANY/P/CT/PROP/SELF/NON_PLATFORM_TARGET), `canReadMatch`/`canReadMatchComments` (§6.3), `isMinor`/`guardianLinkActive`, `deriveLegacyRole`.
- `prisma/schema.prisma` + migração aditiva: `TrainingCenter`, `Club`, `Membership`, `PlayerCT`, `GuardianLink`, `ConsentRecord` (só `DATA`), `AthleteClaim`, `LinkInvite`, `PasswordResetRequest`, `AuditLog`; campos novos em `User`, `Player`, `Match`. Backfill: anotadores (e admins que já criaram/anotaram partidas) → `canOperate=true`; admins → vínculo `PLATAFORMA/ADMIN`.
- Revogação ≤ 60 s: claim `sv` no JWT (login/refresh), `x-user-sv` repassado pelo middleware, cache de 60 s em `session-version.logic.ts`, conferido pelo guarda legado (`getUserFromRequestScoped`) e pelo `refresh`. Tokens antigos (sem `sv`) continuam valendo.
- `accessService.getActor` (cache 60 s) + `withAccessHandler` para as rotas novas + `getAccessUserFromRequest` (aceita role `NONE`).
- Seed bloqueado em produção (`ALLOW_PROD_SEED=true` para liberar).
- Docs: glossário (§8) e `TASKS.md` (TD-057 com as pendências).

## Desvios conscientes do plano (para você revisar)
1. **`canOperate` no backfill:** o plano diz "todo usuário atual"; apliquei só a anotadores e a admins que já criaram/anotaram partidas (P4), para não dar `match:*` a admins que nunca operaram (F3).
2. **`User.cpf` continua obrigatório** nesta fase (tornar opcional mexe em schemas/telas; fica para a 1B com o auto-cadastro).
3. **RLS das tabelas novas** não foi habilitado (pode bloquear o app se o papel do banco não for o dono); fica para a 1B (TD-057).
4. **Onda 0 parcial:** `login`/`refresh` emitem/propagam `sv`; `/me` herda o guarda. O claim derivado entra no `login` na 1B, quando existirem contas sem claim legado. `logout` não mudou.
5. **Rotas de leitura** (admin/users, players, matches) ainda **não** foram migradas para `withAccessHandler`; a infraestrutura está pronta. A gravação de pontos segue intocada (F17).
6. `athleteCode` existe como coluna **opcional**; geração e backfill ficam para a 1C.
7. Falha ao ler `sessionVersion` no banco é **fail-open** (loga e aceita), para não derrubar o sistema; revogação só vale com o banco acessível.

## Arquivos
- NOVO: `prisma/migrations/20261026000000_add_access_foundation/migration.sql`
- NOVO: `scripts/check-access-consistency.mjs`
- NOVO: `src/core/access/__tests__/age.test.ts`
- NOVO: `src/core/access/__tests__/can.matrix.test.ts`
- NOVO: `src/core/access/__tests__/can.rules.test.ts`
- NOVO: `src/core/access/__tests__/fixtures.ts`
- NOVO: `src/core/access/__tests__/visibility.test.ts`
- NOVO: `src/core/access/age.ts`
- NOVO: `src/core/access/can.ts`
- NOVO: `src/core/access/index.ts`
- NOVO: `src/core/access/legacy-role.ts`
- NOVO: `src/core/access/permissions.ts`
- NOVO: `src/core/access/profile-matrix.ts`
- NOVO: `src/core/access/profiles.ts`
- NOVO: `src/core/access/scope.ts`
- NOVO: `src/core/access/types.ts`
- NOVO: `src/core/access/visibility.ts`
- NOVO: `src/lib/__tests__/access-handler.test.ts`
- NOVO: `src/lib/__tests__/auth-credentials.sv.test.ts`
- NOVO: `src/lib/__tests__/jwt-client.sv.test.ts`
- NOVO: `src/lib/__tests__/session-version.test.ts`
- NOVO: `src/lib/access-handler.ts`
- NOVO: `src/lib/session-version.logic.ts`
- NOVO: `src/services/__tests__/access-actor.test.ts`
- NOVO: `src/services/access-actor.logic.ts`
- NOVO: `src/services/accessService.ts`
- ALTERADO: `docs/TASKS.md`
- ALTERADO: `docs/glossario.md`
- ALTERADO: `prisma/schema.prisma`
- ALTERADO: `prisma/seed.ts`
- ALTERADO: `src/app/api/auth/login/route.ts`
- ALTERADO: `src/app/api/auth/refresh/route.ts`
- ALTERADO: `src/lib/auth-credentials.logic.ts`
- ALTERADO: `src/lib/jwt-client.ts`
- ALTERADO: `src/middleware-auth.logic.ts`
- ALTERADO: `src/middleware.ts`
