# STE-DEV — Rastreabilidade de Decisões (RKT)

Este documento registra decisões de arquitetura e exceções conscientes tomadas durante a aplicação da metodologia STE-DEV no projeto RKT.

## Exceções STE-DEV (ste-exception R-XX)

### R-03 — Limite de 100 linhas por arquivo

| Arquivo | Linhas | Motivo | Local |
|---------|--------|--------|-------|
| `src/components/scoring/use-edit-score-calculator.ts` | 150 | Hook de wiring React (`useMemo`) da API do calculator. Toda lógica de decisão vive em módulos puros `src/core/scoring/edit-score-calculator.*.ts` (≤100L cada). | Linha 1 |
| `src/app/api/gestor/coaches-logic.ts` | 113 | Estrutura de transação de `createCoach` (usuário + membership + passwordResetRequest) não se presta a divisão adicional sem prejudicar atomicidade. `ensureCanInsertAthletesColumn` extraído para `coaches-migration.logic.ts`. | Linha 1 |

### R-29 — Substituição de `window.confirm` por `AlertDialog`

| Arquivo | Decisão | Local |
|---------|---------|-------|
| `src/hooks/edit-score-preconditions.logic.ts` | `checkEditScorePreconditions` agora aceita `onConfirm` callback opcional. `window.confirm` mantido como fallback quando `onConfirm` não é fornecido. A migração completa para `AlertDialog` requer refatoração do componente chamador para gerenciar estado de dialog. | Linha do parâmetro `onConfirm` |

## RLS (Row Level Security)

### Tabelas com RLS nativo habilitado

| Tabela | Migration | Policies |
|--------|-----------|----------|
| `users` | Existente (prévia) | Por `current_user_id` / role |
| `Player` | Existente (prévia) | Por `current_user_id` |
| `Match` | Existente (prévia) | Por `createdByUserId` / participantes |
| `PointLog` | Existente (prévia) | Por partida/usuário |
| `match_annotation_sessions` | Existente (prévia) | Por partida/annotator |
| `annotation_endorsements` | Existente (prévia) | Por sessão/usuário |
| `match_score_edits` | Existente (prévia) | Por partida/usuário |
| `match_comments` | Existente (prévia) | Por partida/usuário |
| `training_centers` | Existente (prévia) | Por CT/membro |
| `player_cts` | Existente (prévia) | Por CT/jogador |
| `memberships` | Existente (prévia) | Por CT/usuário |
| `guardian_links` | `20261028020000_add_rls_policies_remaining_tables` | Por guardião/jogador/plataforma |
| `consent_records` | `20261028020000_add_rls_policies_remaining_tables` | Por guardião/jogador/plataforma |
| `athlete_claims` | `20261028020000_add_rls_policies_remaining_tables` | Por usuário/plataforma |
| `link_invites` | `20261028020000_add_rls_policies_remaining_tables` | Por criador/CT/plataforma |
| `password_reset_requests` | `20261028020000_add_rls_policies_remaining_tables` | Por usuário/plataforma |
| `audit_logs` | `20261028020000_add_rls_policies_remaining_tables` | Por ator/plataforma |
| `clubs` | `20261028020000_add_rls_policies_remaining_tables` | Por CT/plataforma |
| `tournaments` | `20261028020000_add_rls_policies_remaining_tables` | Por criador/CT/plataforma |

### Migration bloqueadora corrigida

`20261027050000_assign_suporte_membership` — Adicionado `INSERT` do usuário `cmvprb36c0000ybsvjw14ca2u` antes do `INSERT` em `memberships` para respeitar FK `memberships_userId_fkey`.

## Autorização de partidas (V-14 resolvida)

Eliminado o acoplamento incorreto `match.player1Id === currentUserId` (comparava ID de Player com ID de User). A autorização agora usa `canReadMatch`/`canAnnotateMatch` de `src/core/access/visibility.ts`, que valida estritamente `athletePlayerId` (resolvido a partir de `Player.userId === currentUserId`).

## Validação Zod (V-12 resolvida)

Todos os 8 endpoints pendentes validam entrada com Zod:
- `point` — `PointFlowInputSchema`
- `finish` — `FinishMatchInputSchema`
- `state` — `MatchStateInputSchema`
- `sessions` (POST) — `StartSessionInputSchema`
- `endorse` — `SessionPathParamsSchema`
- `abandon` — `MarkSessionAbandonedInputSchema`
- `suspended-sessions` — query params (sem body)
- `tournament-suggestions` — `TournamentSuggestionsQuerySchema` (query params)

## Logs de produção (V-02, V-03 resolvidos)

`console.log`/`console.debug` removidos de produção. `logger-point.ts` usa `console.error` para erros (sempre ativo) e `devLog` (condicionado por `isDevelopment`) para logs de informação. `logger-dev.helpers.ts` mantém `devLog`/`devDebug`/`devError` condicionados.

## Testes de caracterização (V-15 resolvida)

Baseline `pnpm test:strict` 100% verde (3904/3904 testes, 397 suítes). Não há falhas pré-existentes.

## Rotas de leitura com `withAccessHandler` (V-14 parcial)

Migradas de `withRLSHandler` para `withAccessHandler`:
- `players/route.ts` (GET, POST)
- `players/[id]/route.ts` (GET apenas; PUT/PATCH/DELETE mantidos em `withRLSHandler` pois `athlete:update` é restritivo na matriz de perfis)
- `players/pool/route.ts` (GET)
- `invites/accept/route.ts` (POST)
- `admin/users/route.ts` (GET, POST)
- `admin/users/[id]/route.ts` (PATCH, DELETE)
- `matches/[id]/route.ts` (GET, PUT, PATCH, DELETE)
- `matches/[id]/point/route.ts` (POST)
- `matches/[id]/finish/route.ts` (POST)
- `matches/[id]/state/route.ts` (PATCH, POST)
- `matches/[id]/sessions/route.ts` (GET, POST)
- `matches/[id]/sessions/[sessionId]/endorse/route.ts` (POST)
- `matches/[id]/sessions/[sessionId]/abandon/route.ts` (POST)
- `matches/suspended-sessions/route.ts` (GET)
- `matches/tournament-suggestions/route.ts` (GET)

## Glossário (V-06 resolvido)

`docs/glossario.md` seção 8 desambigua:
- **CT** (`TrainingCenter`) — Centro de Treinamento, dono dos dados (tenant)
- **Club** (`Club`) — Apenas referência (adversário de fora, local da partida)
