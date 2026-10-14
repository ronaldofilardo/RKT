# PLANO DE REFATORAÇÃO STE-DEV — Fase 1 + Fase 2

> **Modo:** Engenharia Reversa → Legado (skill `ste-dev`)
> **Início:** 2026-10-13
> **Regra-mãe:** Fase 1 (S1) + Fase 2 (S2) antes de qualquer monólito (Fase 3).

---

## 0. Escopo e Fora de Escopo

**Em escopo**
- Fase 1 (S1): 8 `catch` vazios (R-08).
- Fase 2 (S2): `any` em fronteiras públicas (R-06) e I/O dentro de UI (R-04).

**Fora de escopo**
- `as any` em mocks de teste (~100 ocorrências).
- Fase 3 (S3): monólitos > 100 linhas (R-03) e nomenclatura proibida (R-02).
- Fase 4 (S4): artefatos órfãos na raiz.

---

## 1. Baseline (Etapa 1 — MEDIR)

| Comando | Resultado |
|---|---|
| `pnpm typecheck` | Verde (0 erros) |
| `pnpm test:setup` | Não executado — suítes da Fase 1 não exigem PostgreSQL |
| `pnpm test:strict` | 291/294 suites · 3191/3196 testes. **3 falhas pré-existentes** (verificadas contra baseline limpo via `git stash`) |

**Falhas pré-existentes (fora do escopo deste plano)**
1. `src/app/dashboard/__tests__/dashboard.hooks.guards.test.tsx` — guard de token expirado (TD-046)
2. `src/hooks/__tests__/useOfflineSync.real.test.ts`
3. `src/app/api/matches/__tests__/match-authorization.baseline.characterization.test.ts`

**Substituição de `scripts/verificar.sh`:** o repositório não possui o script. A verificação canônica é `pnpm test:strict` (`typecheck` + no-skip + Jest CI `--runInBand`), conforme `docs/RULES.md` §7.

---

## 2. Fase 1 (S1) — catches vazios (R-08)

> **Correção de escopo (2026-10-13):** a varredura inicial por regex simples capturou 8 ocorrências.
> O parser de chaves revelou **18 catches vazios** (17 em produção + 1 `ste-exception`).
> Todos foram tratados. Ver seção 6.

**Correção canônica** (padrão já usado em `src/app/api/**`):

```typescript
} catch (error) {
  logger.warn('[TAG] contexto do que falhou:', error);
}
```

Restrições: logar apenas a mensagem do erro; nunca payload, token, e-mail ou snapshot completo.

**Tratamento alternativo — `ste-exception R-08`:** usado quando o `catch` é inevitável
e a degradação é intencional. Aplicado em 7 pontos, todos com motivo explícito:

| Arquivo | Motivo |
|---|---|
| `src/app/match/[id]/scoring/scoringHelpers.ts:32` | Domínio puro (R-05) — I/O proibido |
| `src/core/scoring/timeline-rebuild.ts:146` | Domínio puro (R-05) — I/O proibido |
| `src/middleware.ts:50` | `new URL` lança sobre Origin/Referer malformados |
| `src/app/match/new/components/DateTimeSection.tsx:62,82` | `showPicker()` lança sem suporte no browser |
| `src/components/dashboard/EditMatchInfoModal.tsx:163,183` | `showPicker()` lança sem suporte no browser |

### Slice 1.1
| Arquivo | Linha | Observação |
|---|---|---|
| `src/services/matchService.operations.helpers.ts` | 143 | Importar `logger`. Suite `matchService.operations.helpers.test.ts` existe. |
| `src/lib/snapshot-utils.ts` | 23 | Importar `logger`. **Sem suite — criar characterization test antes (R-15).** |

### Slice 1.2
| Arquivo | Linha | Observação |
|---|---|---|
| `src/contexts/SessionContext.tsx` | 148 | Importar `logger`. Suite `SessionContext.baseline.test.tsx` existe. |
| `src/app/dashboard/dashboard.resume.ts` | 120 | `logger` já importado. Suite `dashboard.resume.floor-fix.test.ts` existe. |

### Slice 1.3
| Arquivo | Linha | Observação |
|---|---|---|
| `src/hooks/useSuspendedSession.ts` | 109 | `logger` já importado. 3 suites existem. |
| `src/hooks/useScoringHandlers.match-fetch.ts` | 84 | `logger` já importado. Suite `useScoringHandlers.match-fetch.history.test.ts` existe. |

### Slice 1.4
| Arquivo | Linha | Observação |
|---|---|---|
| `src/app/match/[id]/scoring/scoringHelpers.ts` | 32 | Importar `logger`. Suite `scoringHelpers.matchTiebreak.test.ts` existe. |
| `src/app/layout.tsx` | 49 | Script inline no `<head>` (string). `console.warn` dentro da string, ou `// ste-exception R-08:` justificado. Sem suite. |

---

## 3. Fase 2 (S2) — R-06 servidor primeiro, depois R-04

Ordem: fronteiras de segurança → contratos de hooks → props de UI → extração de I/O.

| Ordem | Escopo | Arquivos |
|---|---|---|
| **2A** | Server Actions | `src/app/dashboard/dashboard.actions.ts` |
| **2B** | `src/services/` | `matchValidator.ts`, `matchService.ts`, `matchService.operations.helpers.ts`, `matchService.create.helpers.ts`, `sessionService.ts`, `adminService.ts` |
| **2C** | `src/app/api/` | `matches/route.ts`, `matches/[id]/route.ts`, `matches/[id]/point/route.ts`, `matches/[id]/point/route.helpers.ts`, `matches/[id]/state/route.ts`, `matches/[id]/report/route.ts`, `matches/[id]/sessions/[sessionId]/route.ts` |
| **2D** | Contratos de hooks | `useScoringHandlers.types.ts` (hub, primeiro) → `.match-fetch.ts`, `.point-processor.service.ts`, `.serve-actions.service.ts`, `.modals.service.ts`, `.undo-redo.service.ts` → `useSessionManager*.ts`, `useSuspendedSession.ts`, `useModalStack.ts`, `useOfflineMatchSync.ts` |
| **2E** | Props de componentes | `match-card-components.tsx`, `MatchCard.tsx`, `ScoreboardCard.tsx`, `SectionRenderer.tsx`, `NewAthleteModalForm.tsx`, `EditAthletePersonalFields.tsx`, `ScoringTimelineView.tsx` |
| **2F** | R-04 — I/O em UI | Extrair `fetch` de: `admin/page.tsx`, `aguardandoanotador/page.tsx`, `atletas/page.tsx`, `dashboard/page.tsx`, `login/page.tsx`, `match/new/components/NewAthleteModal.tsx`, `match/[id]/report/page.tsx`, `matches/locate/page.tsx`, `components/dashboard/EditMatchInfoModal.tsx`, `components/scoring/AudioNotePlayer.tsx` |

**Normalização incidental:** ao tocar no arquivo, converter `catch (error: any)` em `catch (error)` com narrowing. O binding de `catch` não é fronteira pública; conversão de baixo risco.

---

## 4. Protocolo de Execução (references/legado.md §4)

1. Fatia limitada a **3 arquivos**.
2. Characterization test antes de alterar lógica legada (R-15).
3. Executar `pnpm typecheck` e as suites afetadas após cada fatia.
4. Commit atômico por fatia: `refactor: [o quê]`.
5. Reversão imediata se `pnpm test:strict` falhar.

**Comandos de verificação por fatia**

```bash
pnpm typecheck
node scripts/run-tests.js --ci "<padrão-da-suite>"
```

**Verificação de fim de fase**

```bash
pnpm test:strict        # fim da Fase 1
pnpm test:strict && pnpm test:design && pnpm lint   # fim da Fase 2
```

---

## 5. Definition of Done

- [x] Zero `catch` vazio em código de produção (R-08) — Fase 1.
- [x] Zero `any` em fronteiras públicas de servidor (R-06) — Fase 2 + 3.1 (`any` em produção: 0).
- [x] Zero `fetch` direto em componente `.tsx` (R-04) — Fase 2F.
- [x] `pnpm test:strict` verde ao fim de cada fase — Fase 1 e 2.
- [x] `pnpm test:design` verde ao fim da Fase 2 — 3/3 suites, 26/26 testes.
- [ ] `docs/glossario.md` criado com termos mapeados (R-01) — pendente.
- [x] Toda exceção registrada via `// ste-exception R-XX: <motivo>` — Fase 1 (7× R-08).


---

## 6. Registro de Execução

| Data | Fase | Ação | Status |
|---|---|---|---|
| 2026-10-13 | 0 | Plano criado | Concluído |
| 2026-10-13 | 0 | Baseline `typecheck` verde; 3 falhas de teste pré-existentes confirmadas | Concluído |
| 2026-10-13 | 1.1 | `matchService.operations.helpers` + `snapshot-utils` (characterization criado, 10 testes) | Concluído |
| 2026-10-13 | 1.2 | `SessionContext` + `dashboard.resume` | Concluído |
| 2026-10-13 | 1.3 | `useSuspendedSession` + `useScoringHandlers.match-fetch` | Concluído |
| 2026-10-13 | 1.4 | `scoringHelpers` (ste-exception R-08, domínio puro) + `layout.tsx` | Concluído |
| 2026-10-13 | F1 | `pnpm test:strict` — zero regressão | Concluído |
| 2026-10-13 | 1-C | Escopo corrigido: 16 catches restantes tratados (10 log + 6 ste-exception) | Concluído |
| 2026-10-13 | 2A | `dashboard.actions`, `useDashboardState`, `useDashboardNavigation`, `dashboard.types`, `auth-client` | Concluído |
| 2026-10-13 | 2B-1 | `matchValidator.ts` — 5 assinaturas `any` → tipos derivados de `MatchScoreState` | Concluído |
| 2026-10-13 | 2B-2 | `matchService`, `matchService.create.helpers`, `matchService.operations.helpers` | Concluído |
| 2026-10-13 | 2B-3 | `sessionService`, `adminService` | Concluído |
| 2026-10-13 | F1+F2B | `pnpm test:strict` — 291/294 suites, zero regressão | Concluído |
| 2026-10-13 | 2C | Rotas `src/app/api/**`: 7 `as any` → tipos (feature-detection estrutural, `TennisFormat`, `Parameters<typeof updateSession>[1]`) | Concluído |
| 2026-10-13 | 2D-1 | Hub de contratos `useScoringHandlers.types.ts` (`QueuedAction`, `PointFlow`, `RallyDetails`) | Concluído |
| 2026-10-13 | 2D-2 | Serviços do scoring (`point-processor`, `modals`, `serve-actions`, `undo-redo`, `match-fetch`) | Concluído |
| 2026-10-13 | 2D-3 | `useSuspendedSession`, `useSessionManager(.edit-score|.utils)`, `useScoringHandlers` | Concluído |
| 2026-10-13 | 2D-4 | `useModalStack` (cast `AppRouteInput` do App Router), `useOfflineMatchSync` | Concluído |
| 2026-10-13 | F1+F2A–D | `pnpm test:strict` — 291/294 suites, 3191/3196 testes, zero regressão | Concluído |
| 2026-10-13 | 2E-1 | `src/lib/app-router.ts` (tipo `AppRouteInput` compartilhado) + 5 arquivos com `router.push(... as any)` | Concluído |
| 2026-10-13 | 2E-2 | `dashboard.types.ts` (scoreState/matchStateSnapshot tipados pelo schema) + `dashboard.resume.ts` (guard estrutural `unwrapDashboardScoreState`, contratos de `SessionContext`) | Concluído |
| 2026-10-13 | 2E-3 | `dashboard/page.tsx`, `MatchCard.tsx` (`DashboardMatchPayload`/`SetCellScore`), `ServerSelectionModal.tsx` (`SelectablePlayer`), `match-card-utils/components.tsx`, `MatchTimelineView.tsx`, `ScoreboardCard.tsx` | Concluído |
| 2026-10-13 | 2E-4 | `EditMatchInfoModal.tsx`, `EditScoreModal.types/.submission/.validation`, `useEditScoreCalculator` (`ReturnType`), `editScoreHelpers.ts` (cast removido), `ScoringTimelineView.tsx` (`MatchCommentData[]`), `useScoringPageDerived.ts` | Concluído |
| 2026-10-13 | 2E-5 | Atletas: `src/app/atletas/types.ts` (`AthleteForm`/`EditAthleteSavePayload`), `new-athlete-modal.helpers`, `EditAthletePersonalFields`, `page.tsx`, `NewAthleteModal.tsx` | Concluído |
| 2026-10-13 | 2F-1 | `matchesClient.ts` + `playersClient.ts` (novo padrão HTTP cliente); call sites migrados (dashboard, atletas, EditMatchInfoModal, NewAthleteModal) | Concluído |
| 2026-10-13 | 2F-2 | `adminClient.ts` (novo) + `admin/page.tsx` (3 chamadas); tipo `AdminUser` como fonte única | Concluído |
| 2026-10-13 | 2F-3 | `auth-client.loginRequest` + `login/page.tsx`; `matchesClient.getReport/.listMatches/.getAudio` + `report/page.tsx`, `locate/page.tsx`, `aguardandoanotador/page.tsx`, `AudioNotePlayer.tsx` | Concluído |
| 2026-10-13 | 2F-4 | `SectionRenderer.tsx` (`React.Dispatch<Action>`), `rls-context.ts` (4 `any` → `unknown`/`readonly string[]`) | Concluído |
| 2026-10-13 | Fase 2 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, zero regressão) · `test:design` 3/3 (26/26) · `lint` 0 erros · **0 `fetch` em `.tsx`** · **0 `any` em fronteiras** (restantes 11: `core/scoring/**` + `test-helpers` → Fase 3) | Concluído |
| 2026-10-13 | Commit F1+F2 | `bca1fe7` — 78 arquivos, +1330/−487 | Concluído |
| 2026-10-13 | 3.1a | `state-envelope.ts` (novo) — `unwrapStateEnvelope` tipado; aplicado em `scoring-logic` e `timeline-rebuild`; `TimelineScoreEdit.newScoreState: any → unknown` | Concluído |
| 2026-10-13 | 3.1b | `engine.ts` (`loadState` + `rawServer` widening) e `match-tiebreak.ts` (`as any` removido — `MATCH_TB_10` já na união). **`any` em produção: 0** (R-06 fechado) | Concluído |
| 2026-10-13 | 3.2 | `point-context.ts` (novo) — predicados `isBreakPoint/isGameBall/isSetBall` migrados (re-exportados) + `derivePointSnapshot` + `deriveServeOutcomes`; `enrichPointsFromHistory` 178→63 linhas, CC >10 | Concluído |
| 2026-10-13 | 3.3 | `point-log-merge.ts` (novo) — `PointLogRow` (re-exportado), `buildPointDetailsFromLog`, `mergeWithPointLog`; `timeline-rebuild.ts` 294→153 linhas; `timeline-rebuild.helpers.ts` quebra import circular de tipo | Concluído |
| 2026-10-13 | 3.4 | `game-errors.ts` (novo) — `classifyPointError` deduplica classificação P1/P2; `computeGameErrors` CC 21→13; `set-summary-stats.ts` re-exporta `GameErrorEntry`/`computeGameErrors` | Concluído |
| 2026-10-13 | 3.5 | `tiebreak.ts` — `isMatchTiebreakFormat` + `hasTiebreakBeenWon` extraídos; `processTiebreakPoint` CC 19→<10 (ramos p1/p2 unificados via `winner`) | Concluído |
| 2026-10-13 | 3.6 | `game-processing.ts` — `processNoAdPoint` + `processAdvantagePoint`; `processStandardPoint` CC 16→<10; removidas 2 atribuições redundantes de `state.currentGame` | Concluído |
| 2026-10-13 | Fase 3 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, zero regressão) · `test:design` 3/3 (26/26) · `lint` 0 erros · **nenhuma função de `core/scoring` excede CC 15** (tolerância R-03) · **`any` em produção: 0** | Concluído |

> **Status Fase 3 (escopo `core/scoring/**`): CONCLUÍDA.** 6 fatias atômicas, 6 commits (`b6ce6a1`, `945655c`, `15dd841`, `40c10d1`, `600f5df`, `f9cdae2`, `181d58e`).
> Próxima: **Fase 4** — scratch files na raiz (`scratch_contract_phase2*.js`, `phase4_indexes.sql`), depois varredura de monólitos de UI >100 linhas (`MatchTimelineView.tsx` 535, `MatchCard.tsx` 409, etc.).


