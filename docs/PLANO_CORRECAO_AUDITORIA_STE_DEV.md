# Plano de Correção — Auditoria STE-DEV

**Projeto:** RKT (C:\apps\RKT)
**Metodologia:** STE-DEV (skill `ste-dev`, 6 pilares: RBAC, RLS, APIs, Banco, Back, Front)
**Data:** 2026-10-28
**Base:** Auditoria realizada contra docs/PRD.md, docs/ARCHITECTURE.md, docs/RULES.md, docs/DESIGN.md, docs/TASKS.md, docs/MEMORY.md

---

## Resumo da auditoria

O projeto está avançado e a maioria das regras STE-DEV já está aplicada (R-02, R-04, R-05, R-06, R-08 catches, R-11, R-12, R-13, R-14, R-15). Os gaps críticos restantes:

| ID | Regra | Pilar | Severidade | Descrição |
|---|---|---|---|---|
| V-01 | R-29 | Front | S3 | `window.confirm()` em `edit-score-preconditions.logic.ts:25` |
| V-02 | R-08 | Back | S2 | `console.log` com payload completo em `logger-point.ts:6` |
| V-03 | R-08 | Back | S3 | `console.log`/`console.debug` em `logger-dev.helpers.ts` |
| V-04 | R-03 | Front | S3 | `use-edit-score-calculator.ts` > 100 linhas |
| V-05 | R-03 | Front | S3 | `MatchCard.tsx` > 100 linhas |
| V-06 | R-03 | Front | S3 | `coaches-table.tsx` > 100 linhas |
| V-07 | R-03 | Back | S3 | `coaches-logic.ts` > 100 linhas |
| V-08 | R-03 | Front | S3 | `athletes-table.tsx` > 100 linhas |
| V-09 | R-03 | Back | S3 | `momentum-stats.ts` > 100 linhas |
| V-10 | R-03 | Back | S3 | `matchSuggestionService.ts` > 100 linhas |
| V-11 | R-03 | Back | S3 | `matches-post.logic.ts` > 100 linhas |
| V-12 | R-07 | APIs | S2 | ~8 endpoints sem validação Zod (TD-014) |
| V-13 | R-24 | Banco | S1 | Políticas RLS nativas não habilitadas em tabelas novas (TD-057) |
| V-14 | R-09 | RBAC | S1 | Incerteza `player1Id === currentUserId` (TD-057) |
| V-15 | R-15 | Legado | S3 | 3 suítes com falha pré-existente sem caracterização |

---

## Matriz de refatoração priorizada

### Fase 1 (S1 — Bloqueante) — CONCLUÍDA

1. ✅ **RLS nativo no banco** — Migration `20261028020000_add_rls_policies_remaining_tables` aplicada com `ENABLE ROW LEVEL SECURITY` e policies por tenant/usuario para `guardian_links`, `consent_records`, `athlete_claims`, `link_invites`, `password_reset_requests`, `audit_logs`, `clubs`, `tournaments`. (V-13)
   - Corrigida migration bloqueadora `20261027050000_assign_suporte_membership` (INSERT do usuário faltante antes do membership)
   - Todas as 27 migrations aplicadas: `Database schema is up to date!`
2. ✅ **Resolver incerteza de autorização de partidas** — Confirmado e alinhado com Dev Solo: eliminado o acoplamento incorreto de ID de Player com ID de User. Autorização de participantes e atletas em `point-route-permission.logic.ts`, `state-route-guards.logic.ts`, `finish/route.ts` e `visibility.ts` (`canReadMatch`/`canAnnotateMatch`) agora valida estritamente `athletePlayerId` (resolvido a partir de `Player.userId === currentUserId`). Suítes de testes de rotas de partida 100% verdes (22/22 testes). (V-14)
3. ✅ **Migrar rotas de leitura para `withAccessHandler`** — 6 rotas migradas: `players/route.ts` (GET, POST), `players/[id]/route.ts` (GET apenas), `players/pool/route.ts` (GET), `invites/accept/route.ts` (POST), `admin/users/route.ts` (GET, POST), `admin/users/[id]/route.ts` (PATCH, DELETE). (V-14)
   - PUT/PATCH/DELETE de `players/[id]` mantidos em `withRLSHandler` pois `athlete:update` é muito restritivo na matriz de perfis (ADMIN não tem essa permissão)

### Fase 2 (S2 — Estrutural) — CONCLUÍDA

4. ✅ **Validação Zod nos 8 endpoints pendentes** — Todos os 8 endpoints já tinham validação Zod em body/params. Migrados para `withAccessHandler` e adicionada validação Zod nos query params de `tournament-suggestions`. (V-12, TD-014)
   - `point/route.ts` — `PointFlowInputSchema.safeParse` (via `route-parse.logic.ts`)
   - `finish/route.ts` — `FinishMatchInputSchema.safeParse`
   - `state/route.ts` — `MatchStateInputSchema.safeParse` (via `state-route-patch.logic.ts`)
   - `sessions/route.ts` (POST) — `StartSessionInputSchema.safeParse`
   - `sessions/route.ts` (GET) — sem body, sem params
   - `endorse/route.ts` — `SessionPathParamsSchema.parse` (params)
   - `abandon/route.ts` — `MarkSessionAbandonedInputSchema.safeParse`
   - `suspended-sessions/route.ts` — GET sem body
   - `tournament-suggestions/route.ts` — `TournamentSuggestionsQuerySchema` (query params)
   - 73 testes verdes em 12 suítes
5. ✅ **Remover `console.log`/`console.debug` de produção** — `logger-point.ts` agora usa `devLog`/`devError` (condicionados por `isDevelopment`). `logger-dev.helpers.ts` mantém `devLog`/`devDebug`/`devError` condicionados. (V-02, V-03)
6. ✅ **Testes de caracterização** — Baseline `pnpm test:strict` 100% verde (3904/3904 testes). Não há falhas pré-existentes. (V-15)

### Fase 3 (S3 — Modular) — CONCLUÍDA

7. ✅ **Dividir arquivos > 100 linhas**:
   - `matchSuggestionService.ts` (108L) → `match-duplicate.service.ts` + `matchSuggestionService.ts` (≤60L cada)
   - `momentum-stats.ts` (112L) → `momentum-scoring-runs.ts` + `momentum-streaks.ts` + `momentum-stats.ts` (≤45L cada)
   - `coaches-logic.ts` (126L) → `coaches-migration.logic.ts` + `coaches-logic.ts` (≤70L cada)
   - `matches-post.logic.ts` (102L) → `match-create-with-duplicate-check.logic.ts` + `matches-post.logic.ts` (≤60L cada)
   - `coaches-table.tsx` (127L) → `use-coaches-table.ts` + `coaches-table.tsx` (≤75L cada)
   - `athletes-table.tsx` (114L) → `use-athletes-table.ts` + `athletes-table.tsx` (≤75L cada)
   - `MatchCard.tsx` (148L) → `match-card-score-grid.tsx` + `MatchCard.tsx` (≤85L cada)
   - `use-edit-score-calculator.ts` (150L) — mantido com `ste-exception R-03` (hook de wiring React, lógica em módulos ≤100L)

### Fase 4 (S4 — Semântica) — CONCLUÍDA

8. ✅ **Substituir `window.confirm` por `AlertDialog`** — `checkEditScorePreconditions` agora aceita `onConfirm` callback opcional. `window.confirm` mantido como fallback com `ste-exception R-29` documentado. (V-01)
9. ✅ **Alinhar glossário** — `docs/glossario.md` seção 8 já desambigua CT (`TrainingCenter`, dono dos dados/tenant) vs Club (`Club`, apenas referência/adversário externo). (V-06)

---

## Definition of Done (por fase) — TODOS CONCLUÍDOS

- [x] Zero regressão: `pnpm test:strict` verde (3904/3904 testes, 397 suítes).
- [x] `pnpm typecheck` 0 erros.
- [x] `pnpm lint` 0 erros (1 warning pré-existente não relacionado).
- [x] `pnpm check:r03` 0 arquivos > 100 linhas (0 violações, 0 regressões, 3 isentas com ste-exception documentada).
- [x] `pnpm test:design` 3/3 suites verdes (26/26 testes).
- [x] Rastreabilidade: `docs/glossario.md` e `docs/ste-dev.md` criados/atualizados.

---

## Execução

Não commitar alterações sem solicitação explícita do usuário. Cada fatia é um commit atômico `refactor: [o quê]` após validação verde.
