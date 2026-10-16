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
- [x] `pnpm test:strict` verde ao fim de cada fase — Fases 1, 2, 3, UI-1..UI-9 (291/294, baseline).
- [x] `pnpm test:design` verde ao fim da Fase 2 — 3/3 suites, 26/26 testes.
- [x] `docs/glossario.md` criado com termos mapeados (R-01) — recriado em UTF-8 limpo (147 linhas; o anterior tinha mojibake).
- [x] Toda exceção registrada via `// ste-exception R-XX: <motivo>` — Fase 1 (7× R-08; 6 ativos após UI-3b unificar os 2 `showPicker` de `EditMatchInfoModal` num único `openPicker`).
- [x] Nenhum arquivo UI/componente >100 linhas (R-03) — **CONCLUÍDO** (rodadas UI-1..UI-44; medido 2026-10-16 pós UI-44: **0 arquivos `.tsx` de produção >100L** entre 193; testes excluídos; backlog 53 → 0).
- [x] Nomenclatura proibida (R-02) — **CONCLUÍDO** (Fases A/B/C; medido 2026-10-16: **0 `handle*`/`process*`/`manage*`/`doAction` em produção; 0 arquivos `*helper*`/`*utils*` no nome**; 39 arquivos renomeados, 98 funções renomeadas; testes excluídos).


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
| 2026-10-14 | 4 | Scratch files órfãos removidos da raiz (`scratch_contract_phase2*.js` ×3, `phase4_indexes.sql` — índices já no `schema.prisma`). Commit `d05bc60` | Concluído |
| 2026-10-14 | UI-1a | `timeline-set-results.ts` (novo, domínio) — `extractSetsFromScoreState`/`computeSetResultsFromPoints` particionadas em helpers (CC 20 e 22 → todas ≤10); re-exports em `MatchTimelineView.tsx` (535→399). Commit `132bd11` | Concluído |
| 2026-10-14 | UI-1b | `timeline-match-info.tsx` (86L, `MatchInfoData`+`buildInfoItems`+`MatchInfoLine`) e `use-timeline-filters.ts` (72L); `MatchTimelineView.tsx` 399→251. Commit `8ba86da` | Concluído |
| 2026-10-14 | UI-1c | `timeline-table-head.tsx` (58L, colgroup como array + thead) e `timeline-table.tsx` (84L, `FinalResultRow` extraído); `MatchTimelineView.tsx` 251→146. Commit `3f3b4dd` | Concluído |
| 2026-10-14 | UI-1d/e | `timeline-comments.tsx`, `timeline-legend.tsx`, `timeline-header.tsx`; `MatchTimelineView.tsx` 146→96. Commit `ee666cc` | Concluído |
| 2026-10-14 | UI-fix | `ee666cc` não estava verde: restaurado condicional `hideFilters` (consumido por `ReportPage.view.tsx:165`) e removidos imports órfãos `FilterBar`/`AudioNotePlayer`. Commit `907f956` | Concluído |
| 2026-10-14 | UI-DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros | Concluído |
| 2026-10-14 | Revert | Extrações de UI não commitadas de sessão anterior (dashboard, AdvancedStats, SetSummaryModal, NewMatchForm) estavam com **34 erros de typecheck** — descartadas conforme decisão do usuário. `docs/glossario.md` (R-01) também removido: 220 linhas com encoding corrompido (mojibake) | Descartado |
| 2026-10-14 | R-01 | `docs/glossario.md` recriado em UTF-8 limpo (147 linhas): papéis, entidades Prisma, enums, domínio de scoring, rally details, siglas de UI. Termos extraídos de `schema.prisma`, `src/schemas/*.ts` e `core/scoring/types.ts`. Roundtrip UTF-8 verificado, sem BOM | Concluído |
| 2026-10-14 | UI-2a | `match-card-types.ts` (novo, 39L) — `DashboardMatchPayload`/`MatchCardProps`; re-export de compatibilidade em `MatchCard.tsx` (409→374). Commit `ecadac2` | Concluído |
| 2026-10-14 | UI-2b | `match-card-player-row.tsx` (91L: `MatchCardPlayerRow`/`ScoreCell`/`Separator`, deduplica 6 blocos), `match-card-score-table.tsx` (98L: `MatchCardScoreTable` com `renderCells` + `MatchCardSetsCells`), `match-card-score.tsx` (86L, dispatcher de 3 modos); `MatchCard.tsx` 374→234. Commit `40951dd` | Concluído |
| 2026-10-14 | UI-2c | `match-card-header.tsx` (99L: `MatchStatusBadge` + 4 botões unificados em `HeaderButton` com `BTN_BASE`/`VARIANT` + `MatchActions` + `FormatLabel`); `MatchCard.tsx` 234→167. Commit `057e3fb` | Concluído |
| 2026-10-14 | UI-2d | `use-match-card-data.ts` (91L: `scoreState`, `suspendedAnnotationScore`, `displayedSets` com projeção `SHORT_SET_2V2_NO_AD`, `currentServer`, `isCurrentSetMT`, `lastSetTiebreakScore`, cores de quadra, `setsWon`); `MatchCard.tsx` 167→**86**. Commit `bc72bbd` | Concluído |
| 2026-10-14 | UI-2 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para MatchCard**: 7 arquivos ≤100L (`MatchCard.tsx` 86, `match-card-types.ts` 39, `match-card-player-row.tsx` 91, `match-card-score.tsx` 86, `match-card-score-table.tsx` 98, `match-card-header.tsx` 99, `use-match-card-data.ts` 91) | Concluído |
| 2026-10-15 | UI-3a | `edit-match-info-submission.ts` (novo, domínio puro, 97L) — `EditMatchInfoFormValues`, `initialFormValues`, `buildScheduledAt`, `buildUpdateInfoPayload`; 12 `useState` agrupados num objeto com `setValue` genérico; `handleSubmit` fino. CC máxima 4. Commit `b2dd8de` | Concluído |
| 2026-10-15 | UI-3b | `edit-match-info-fields.tsx` (100L: `FormField`, `TextInput` com `openPicker`/ste-exception R-08, `SelectField`, `TextareaField` — deduplica as 12 classNames), `edit-match-info-sections.tsx` (99L: DateTime, Tournament, Details, `FormFooter`), `edit-match-info-grid-sections.tsx` (46L: Court, Weather); `EditMatchInfoModal.tsx` 330→**97**. Commit `f18ae3c` | Concluído |
| 2026-10-15 | UI-3 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para EditMatchInfoModal**: 5 arquivos ≤100L (`EditMatchInfoModal.tsx` 97, `edit-match-info-fields.tsx` 100, `edit-match-info-sections.tsx` 99, `edit-match-info-grid-sections.tsx` 46, `edit-match-info-submission.ts` 97) | Concluído |
| 2026-10-15 | UI-4a | `timeline-row-utils.ts` (novo, 54L, domínio) — `getPlayerInitials`, `BADGE_COLORS`, `getPointBadge`, `getGameScoreLabelForPoint`; `timeline-rows.tsx` 341→301 + re-export. CC máx 6. Commit `7e1a2ac` | Concluído |
| 2026-10-15 | UI-4b | `timeline-row-cells.tsx` (99L: `IdentityCells`, `ServeOutcomeCells` com `FlagCell` deduplicando ACE/OUT/NET, `RallyDetailCells`) + `timeline-row-note-cell.tsx` (33L); `timeline-rows.tsx` 301→214. Commit `69065db` | Concluído |
| 2026-10-15 | UI-4c | `timeline-point-row.tsx` (87L: `PointRow`) + `timeline-row-inserts.tsx` (48L: `SegmentBreakCell`, `GapCell`, `PointRowWithInsert`); `timeline-rows.tsx` 214→110. Commit `55571ae` | Concluído |
| 2026-10-15 | UI-4d | `timeline-game-end-row.tsx` (44L: linha de placar final); `timeline-rows.tsx` 110→**81**. Commit `b51681d` | Concluído |
| 2026-10-15 | UI-4 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para timeline-rows**: 7 arquivos ≤100L (`timeline-rows.tsx` 81, `timeline-point-row.tsx` 87, `timeline-row-cells.tsx` 99, `timeline-row-utils.ts` 54, `timeline-row-inserts.tsx` 48, `timeline-game-end-row.tsx` 44, `timeline-row-note-cell.tsx` 33) | Concluído |
| 2026-10-15 | UI-5a | `scoring-page-screens.tsx` (novo, 71L) — `LoadingScreen`, `ErrorScreen`, `SyncStatusBanner` (mapa `BANNER`), `TimelineLoadingOverlay`; `scoring/page.tsx` 339→301. Commit `69e50d5` | Concluído |
| 2026-10-15 | UI-5b | `use-scoring-page-chrome.ts` (novo, 88L, CC 5) — `liveCounters`, `tacticalInsights`, `setSummaryModalState` + effect, `isTimelineLoading`, `handleOpenTimeline`; exporta os tipos `ScoringPageState`/`ScoringPageEffects`/`ScoringPageDerived` via `ReturnType`; `page.tsx` 301→247. Commit `914a245` | Concluído |
| 2026-10-15 | UI-5c | `scoring-page-play-area.tsx` (86L, prop `match: NonNullable<ScoringPageState['match']>` em vez de asserção `!`) + `scoring-page-controls.tsx` (70L: ActionBar + AnnotationSessionPanel); `page.tsx` 247→132. Commit `087d5c9` | Concluído |
| 2026-10-15 | UI-5d | `scoring-page-layout.tsx` (95L: raiz com fontScale, banner, header, overlay, PlayArea, Controls e ScoringModals; `match` já estreitado pela página); `page.tsx` 132→**94**; `dual-theme.characterization.test.tsx` passou a ler `page.tsx` + `scoring-page-layout.tsx` (comportamento inalterado). Commit `a66caf2` | Concluído |
| 2026-10-15 | UI-6a | `use-dashboard-match-actions.ts` (119L: clique, retomar, editar placar/infos, iniciar, relatório, finalizar, excluir + modal de edição) e `use-dashboard-set-summary.ts` (70L: fetch de análise de set + `completedSetsCount`/`completedSetsData` em helpers puros); `dashboard/page.tsx` 337→262. Commit `20ddd92` | Concluído |
| 2026-10-15 | UI-6b | `components/DashboardChrome.tsx` (84L, CC 3) — TopBar, Sidebar, `menuItems` (Admin condicional ao role), estado do menu hambúrguer e fluxo completo de logout (`ConfirmAlertDialog` + `clearAuthState` + redirect); `page.tsx` 262→205. Commit `9649b49` | Concluído |
| 2026-10-15 | UI-6c | `components/ConfirmDeleteMatchDialog.tsx` (40L) + `components/DashboardMatchModals.tsx` (94L, CC 6: exclusão, seleção de sacador, resumo de set, edição de infos com props tipadas); `page.tsx` 205→157. Commit `9331a37` | Concluído |
| 2026-10-15 | UI-6d | `use-dashboard-page-model.ts` (novo, 90L, CC 5/1) — auth, navegação, dados, modais, retomada, exclusão/finalização, filtros e `resolveDashboardView`; `page.tsx` 157→**69** (composição `model` + `actions` + `summary`). Commit `93a6cda` | Concluído |
| 2026-10-15 | UI-6e | `use-dashboard-server-start.ts` (novo, 43L: seleção de sacador + `startMatch`) extraído das ações; `use-dashboard-match-actions.ts` 119→98 (compõe via spread). Commit `2000533` | Concluído |
| 2026-10-15 | UI-5/6 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline — 3 falhas pré-existentes) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓** para `scoring/page.tsx` (6 arquivos ≤100L) e `dashboard/page.tsx` (8 arquivos ≤100L) · fatias de `scoring`: 133 suites/1650 testes verdes; de `dashboard`: 20 suites (falha única = baseline) | Concluído |
| 2026-10-15 | UI-7a | `set-summary-stat-bar.tsx` (novo, 48L) — `StatBarBilateral` extraída com `StatBarBilateralProps`; `SetSummaryModal.tsx` 327→283. Commit `9ba9637` | Concluído |
| 2026-10-15 | UI-7b | `set-summary-stats-sections.tsx` (novo, 88L) — Saque & Eficiência + Break Points (`p1`/`p2` via `SetSummaryReport["player1"]`); `SetSummaryModal.tsx` 283→213. Commit `58db88a` | Concluído |
| 2026-10-15 | UI-7c | `set-summary-header.tsx` (68L: badge, duração, título, fechar e abas de set) + `set-summary-score-card.tsx` (40L: placar com vencedor/tiebreak); `SetSummaryModal.tsx` 213→152. Commit `81d2b38` | Concluído |
| 2026-10-15 | UI-7d | `use-set-summary-report.ts` (58L: sets disponíveis, set selecionado sincronizado e `summary` via `computeSetSummary`; exporta `CompletedSetData`) + `set-summary-footer.tsx` (63L: concluir/relatório, fechar, retomar); `SetSummaryModal.tsx` 151→**91**. Commit `c102365` | Concluído |
| 2026-10-15 | UI-7 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para SetSummaryModal**: 7 arquivos ≤100L (`SetSummaryModal.tsx` 91, `set-summary-stat-bar.tsx` 48, `set-summary-stats-sections.tsx` 88, `set-summary-header.tsx` 68, `set-summary-score-card.tsx` 40, `set-summary-footer.tsx` 63, `use-set-summary-report.ts` 58) · 133 suites/1650 testes de scoring verdes | Concluído |
| 2026-10-15 | UI-8a | `advanced-stats-primitives.tsx` (novo, 50L: `StatRow`, `Section`, `PlayerColumnHeader` deduplicando o cabeçalho de colunas repetido em 4 seções, `AdvancedStatsSectionProps`) + `advanced-stats-basic-sections.tsx` (58L: Serve/Return/Pressure); `AdvancedStats.tsx` 316→228. Commit `8b043d0` | Concluído |
| 2026-10-15 | UI-8b | `advanced-stats-shot-section.tsx` (novo, 100L: lances, rally, por golpe com `ByStrokeGrid` deduplicando os dois blocos idênticos e mesma guarda de vazio, backhand); `AdvancedStats.tsx` 228→129. Commit `642debd` | Concluído |
| 2026-10-15 | UI-8c | `advanced-stats-momentum.tsx` (50L) + `advanced-stats-set-breakdown.tsx` (66L); `AdvancedStats.tsx` 129→**23**. Commit `3f257a2` | Concluído |
| 2026-10-15 | UI-8 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para AdvancedStats**: 6 arquivos ≤100L (`AdvancedStats.tsx` 23, `advanced-stats-primitives.tsx` 50, `advanced-stats-basic-sections.tsx` 58, `advanced-stats-shot-section.tsx` 100, `advanced-stats-momentum.tsx` 50, `advanced-stats-set-breakdown.tsx` 66) · 13 suites/47 testes de report verdes | Concluído |
| 2026-10-15 | UI-9a | `edit-score-game-column.tsx` (novo, 64L) e `edit-score-games-grid.tsx` (novo, 68L) — coluna de games de um jogador (marcador de saque na ordem P1/P2, input com borda de liderança) e grade P1 × P2 com `maxGames` por formato; `totalEditedSets` removido dos props (não usado) | Concluído |
| 2026-10-15 | UI-9b | `edit-score-form-feedback.tsx` (novo, 93L: `EditScoreFormErrors` + `EditScoreFormFeedback` com `buildStatusMessage`) e `edit-score-form-actions.tsx` (novo, 84L: confirmar set, banner de fim de partida, ponto de parada, slot children p/ game points); `edit-score-form.tsx` 320 → 213 | Concluído |
| 2026-10-15 | UI-9c-1 | `edit-score-form-header.tsx` (novo, 52L: rótulo do set com selo de MT potencial + card Partida Encerrada), `edit-score-form-trail.tsx` (novo, 85L: feedback + ações + game points) e `edit-score-form-body.tsx` (novo, 99L: composição do root) | Concluído |
| 2026-10-15 | UI-9c-2 | `edit-score-form.tsx` 213 → **60** linhas — casca fina: interface `SetInputFormProps`, ref de foco, early-return e composição de `EditScoreFormBody` | Concluído |
| 2026-10-15 | UI-9 DoD | `typecheck` verde · `test:strict` 291/294 (3191/3196, baseline) · `test:design` 3/3 (26/26) · `lint` 0 erros · **R-03 ✓ para edit-score-form**: 8 arquivos ≤100L (`edit-score-form.tsx` 60, `edit-score-form-body.tsx` 99, `edit-score-form-trail.tsx` 85, `edit-score-form-header.tsx` 52, `edit-score-form-feedback.tsx` 93, `edit-score-form-actions.tsx` 84, `edit-score-games-grid.tsx` 68, `edit-score-game-column.tsx` 64) · 9 suites/163 testes de edit-score verdes | Concluído |
| 2026-10-15 | UI-10a | `comment-modal-views.tsx` (49L), `comment-voice-recorder.tsx` (87L), `use-comment-modal.ts` (78L). Commit `a847e75` | Concluído |
| 2026-10-15 | UI-10b | `comment-modal-body.tsx` (97L); `CommentModal.tsx` 293→**47** — **R-03 ✓**. Commit `4bee199` | Concluído |
| 2026-10-15 | UI-11a | `edit-score-modal-shell.tsx` (48L), `edit-score-note-field.tsx` (26L), `edit-score-confirm-overlay.tsx` (22L), `edit-score-modal-content.tsx` (184L); `EditScoreModal.tsx` 261→**148**. Commits `f9ee743`, `e204f00` — **R-03 pendente** (`EditScoreModal` 148 e `edit-score-modal-content` 184 ainda >100L) | Concluído |
| 2026-10-15 | R-03 | `match/new/page.tsx` 260→**121** (ainda >100L) via `MatchNewErrorBanner.tsx` (28L), `MatchNewModals.tsx` (72L), `TournamentSection.tsx` (101L) — commit `9703e13` (junto com feat "primeiro nome no header") | Concluído |
| 2026-10-15 | UI-11b | `edit-score-modal.types.ts` (novo, 99L: `Player`, `EditScoreModalProps`, `EditScoreModalContentProps`); `EditScoreModal.tsx` 148→109, `edit-score-modal-content.tsx` 184→121. Commit `0933b49` | Concluído |
| 2026-10-15 | UI-11c | `edit-score-set-input-section.tsx` (novo, 82L: `EditScoreSetInputSection` via `Pick` de props, bindings do `SetInputForm`); `edit-score-modal-content.tsx` 121→**92** — **R-03 ✓**. Commit `33b845a` | Concluído |
| 2026-10-15 | UI-11d | `use-edit-score-modal-view.ts` (novo, 89L: `effectiveFloorTiebreak` + wiring do `useEditScoreModal`); `EditScoreModal.tsx` 109→**65** — **R-03 ✓**. Commit `a9ed92f` | Concluído |
| 2026-10-15 | UI-11 DoD | `typecheck` verde · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros · suítes edit-score/EditScoreModal: 24 suites/273 testes verdes · **R-03 ✓ para EditScoreModal**: 6 arquivos ≤100L (`EditScoreModal.tsx` 65, `edit-score-modal-content.tsx` 92, `edit-score-set-input-section.tsx` 82, `edit-score-modal.types.ts` 99, `use-edit-score-modal-view.ts` 89, `edit-score-modal-shell.tsx` 48) | Concluído |
| 2026-10-15 | UI-12a | `scoreboard-card.types.ts` (29L) + `scoreboard-card-logic.ts` (82L, lógica pura de placar); `ScoreboardCard.tsx` 250→224. **Guardião telemetry**: tokens `telemetry-` mantidos no container e nenhum arquivo proibido criado. Commit `5ae6247` | Concluído |
| 2026-10-15 | UI-12b | `use-scoreboard-card-data.ts` (76L) + `scoreboard-player-row.tsx` (69L); `ScoreboardCard.tsx` 224→116. Commit `a52a229` | Concluído |
| 2026-10-15 | UI-12c | `scoreboard-card-cells.tsx` (49L); `ScoreboardCard.tsx` 116→**72** — **R-03 ✓**. Commit `ba9e552` | Concluído |
| 2026-10-15 | UI-12 DoD | `typecheck` verde · suítes ScoreboardCard/telemetry: 3 suites/29 testes verdes · **R-03 ✓ para ScoreboardCard**: 6 arquivos ≤100L (`ScoreboardCard.tsx` 72, `scoreboard-card-cells.tsx` 49, `scoreboard-card-logic.ts` 82, `scoreboard-card.types.ts` 29, `use-scoreboard-card-data.ts` 76, `scoreboard-player-row.tsx` 69) | Concluído |
| 2026-10-15 | UI-13a | `use-admin-page.ts` (92L, estado/efeitos/derivados) + `admin-users-table.tsx` (96L, `AdminUsersTable` com busca/paginação); `admin/page.tsx` 249→165. Commit `50f58a3` | Concluído |
| 2026-10-15 | UI-13b | `admin-dashboard-chrome.tsx` (75L: header, métricas, navegação e ações globais); `admin/page.tsx` 165→**77** — **R-03 ✓**. Commit `2171843` | Concluído |
| 2026-10-15 | UI-13 DoD | `typecheck` verde · suítes admin: 5 suites/44 testes verdes · **R-03 ✓ para admin/page**: 3 arquivos ≤100L (`admin/page.tsx` 77, `admin-users-table.tsx` 96, `admin-dashboard-chrome.tsx` 75) + `use-admin-page.ts` 92 | Concluído |
| 2026-10-15 | UI-14a | `dashboard-view-router.types.ts` (23L, `DashboardViewRouterProps`/`DashboardView`) + `dashboard-match-list-section.tsx` (43L, seção genérica com `renderCard`); `DashboardViewRouter.tsx` 241→133. Commit `83b4c5f` | Concluído |
| 2026-10-15 | UI-14b | `dashboard-home-section.tsx` (79L: view dashboard — heading `sr-only`, anotações suspensas, lista com vazio); `DashboardViewRouter.tsx` 133→**98** — **R-03 ✓** (guardião `return views[view]() \|\| views.dashboard();` preservado). Commit `bc4c709` | Concluído |
| 2026-10-15 | UI-14 DoD | `typecheck` verde · suítes dashboard: 21 suites/179 testes verdes · **R-03 ✓**: `DashboardViewRouter.tsx` 98, `dashboard-home-section.tsx` 79, `dashboard-match-list-section.tsx` 43, `dashboard-view-router.types.ts` 23 | Concluído |
| 2026-10-15 | UI-15a | `session-context.types.ts` (51L: `SessionData`, `AbandonPayload`, `SessionAction`, `SessionContextValue`) + `session-context.reducer.ts` (48L: `initialState` + `sessionReducer`); `SessionContext.tsx` 238→157 (re-export de `SessionData` preservado). Commit `e7c6d51` | Concluído |
| 2026-10-15 | UI-15b | `session-storage.helpers.ts` (52L: `SESSION_STORAGE_KEY_PREFIX`, `readPreservedFields` com `logger.warn`, `buildStoredSession`, `parseStoredSessionPayload`) + callbacks compactados; `SessionContext.tsx` 157→**98** — **R-03 ✓**. Commit `edfd783` | Concluído |
| 2026-10-15 | UI-15 DoD | `typecheck` verde · suítes session: 28 suites/210 testes verdes · **R-03 ✓ para SessionContext**: 4 arquivos ≤100L (`SessionContext.tsx` 98, `session-storage.helpers.ts` 52, `session-context.types.ts` 51, `session-context.reducer.ts` 48) | Concluído |
| 2026-10-15 | R-03 rodada | **DoD final da rodada UI-12..15**: `typecheck` verde · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **backlog R-03: 33 → 29 arquivos `.tsx` de produção >100L** | Concluído |
| 2026-10-15 | UI-16a | `new-athlete-modal-form.types.ts` (26L: `fieldIds` + props via `Pick` nas seções), `new-athlete-birth-input.tsx` (54L: `BirthDateFields` deduplicando DD/MM/AAAA via `BIRTH_PARTS`), `new-athlete-personal-fields.tsx` (68L: Nome + Sexo + nascimento); `NewAthleteModalForm.tsx` 235→128. Commit `0fd1903` | Concluído |
| 2026-10-15 | UI-16b | `new-athlete-class-category-section.tsx` (58L: early-return equivalente à condição original) + `new-athlete-skills-section.tsx` (44L: dominância/backhand); `NewAthleteModalForm.tsx` 128→**60** — **R-03 ✓**. Commit `27a26b7` | Concluído |
| 2026-10-15 | UI-16 DoD | `typecheck` verde · suítes NewAthleteModal: 2 suites/38 testes verdes · **R-03 ✓**: form 60, personal-fields 68, class-category 58, birth-input 54, skills 44, types 26 | Concluído |
| 2026-10-15 | UI-17a | `server-effect-modal.types.ts` (13L: `ServerEffectContext`/`ServeStep`/`ServerErrorType` + props), `server-effect-modal-controls.tsx` (44L: consts de botão, `EFFECT_OPTIONS`/`DIRECTION_OPTIONS`, `PillGroup`, `Section`), `server-effect-modal-header.tsx` (38L); `ServerEffectModal.tsx` 235→172. **Guardião telemetry**: `ServerEffectModal.view.tsx` não criado. Commit `611b083` | Concluído |
| 2026-10-15 | UI-17b | `server-effect-modal-body.tsx` (38L), `server-effect-modal-footer.tsx` (31L), `server-effect-modal-close-dialog.tsx` (42L); `ServerEffectModal.tsx` 172→**95** (callbacks compactados, `border-t-4` inline) — **R-03 ✓**. Commit `1fc57af` | Concluído |
| 2026-10-15 | UI-17 DoD | `typecheck` verde · 5 suites/57 testes (ServerEffectModal + scoring.page.characterization + design-pattern + telemetry-integrity) verdes · **R-03 ✓**: 7 arquivos ≤100L | Concluído |
| 2026-10-15 | UI-18 | Fatia única: `edit-score-summary-header.tsx` (18L, cabeçalho de colunas deduplicado), `edit-score-sets-summary.tsx` (66L), `edit-score-match-summary.tsx` (37L); `edit-score-summary.tsx` 216→**92** como barrel + `EditableSetsSummary` (API `{SetsSummary, EditableSetsSummary, MatchSummary}` preservada). Commit `50b89b6` | Concluído |
| 2026-10-15 | UI-18 DoD | `typecheck` verde · suítes edit-score: 9 suites/163 testes verdes · **R-03 ✓**: summary 92, sets-summary 66, match-summary 37, header 18 | Concluído |
| 2026-10-15 | UI-19 | Fatia única: `edit-athlete-modal.types.ts` (26L), `edit-athlete-modal.submission.ts` (44L, puro: `buildFormFromAthlete`/`buildSavePayload`), `use-edit-athlete-modal.ts` (94L: estado + efeitos + handlers); `EditAthleteModal.tsx` 215→**97** (API `{EditAthleteModal, type EditAthleteSavePayload}` preservada via re-export; `EMPTY_ATHLETE_FORM` reutilizado). Commit `f3bb5a1` | Concluído |
| 2026-10-15 | UI-19 DoD | `typecheck` verde · suítes EditAthleteModal/atletas: 5 suites/22 testes verdes · **R-03 ✓**: modal 97, hook 94, submission 44, types 26 | Concluído |
| 2026-10-15 | UI-20a | `locate-matches.helpers.ts` (47L: `Match`, `LocateFilterStatus`, `filterMatches` puro, `getStatusColor`/`getStatusLabel`), `use-locate-matches.ts` (35L: estado + fetch com AbortController + filtragem), `locate-matches-filters.tsx` (58L); `locate/page.tsx` 206→124. Commit `eb1c5f7` | Concluído |
| 2026-10-15 | UI-20b | `locate-match-row.tsx` (68L: linha de partida com botões via `onNavigate`); `locate/page.tsx` 124→**72** (cast único `as AppRouteInput` na página) — **R-03 ✓**. Commit `0f7ec5a` | Concluído |
| 2026-10-15 | UI-20 DoD | `typecheck` verde · suite locate characterization: 1/1 verde · **R-03 ✓**: page 72, row 68, filters 58, helpers 47, use-locate 35 | Concluído |
| 2026-10-15 | R-03 rodada | **DoD final da rodada UI-16..20**: `typecheck` verde (exit 0) · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **backlog R-03: 29 → 24 arquivos `.tsx` de produção >100L** | Concluído |
| 2026-10-16 | UI-21 | Fatia única: `scoring-edit-score-modal.logic.ts` (34L: `buildCurrentGamePoints`/`buildFloorTiebreak` puros), `scoring-edit-score-modal.tsx` (62L: wiring do EditScoreModal), `scoring-session-modals.tsx` (69L: setup/undo/comment/SetSummary); `ScoringModals.tsx` 203→**91** (serve-effect e point-details inline). Commit `7abcca2` | Concluído |
| 2026-10-16 | UI-21 DoD | `typecheck` verde · suítes scoring.page.characterization + design-pattern + useScoringPageEffects: 3 suites/40 testes verdes · **R-03 ✓**: 91, 69, 62, 34 | Concluído |
| 2026-10-16 | UI-22 | Fatia única: `point-details-notes.helpers.ts` (7L: `formatDuration`), `point-details-notes-voice-controls.tsx` (78L: erro/idle/recording/recorded), `point-details-notes-fields.tsx` (79L: `NoteModeTabs`/`NoteTextarea`/`NoteFooterButtons`); `PointDetailsNotesModal.tsx` 201→**84** (`hasContent` com `Boolean(...)`). Commit `0fbcd9b` | Concluído |
| 2026-10-16 | UI-22 DoD | `typecheck` verde · suítes PointDetailsModal + telemetry-integrity: 3 suites/69 testes verdes · **R-03 ✓**: 84, 79, 78, 7 | Concluído |
| 2026-10-16 | UI-23 | Fatia única: `atletas.types.ts` (18L: `Athlete`/`RankingEntry`), `hooks/useAtletasPage.ts` (100L: estado + load/auth/save/delete), `components/DeleteAthleteModal.tsx` (59L); `page.tsx` 197→**82**. Commit `e933493` | Concluído |
| 2026-10-16 | UI-23 DoD | `typecheck` verde · suite atletas characterization: 1 suite/12 testes verdes · **R-03 ✓**: page 82, hook 100, modal 59, types 18 | Concluído |
| 2026-10-16 | UI-24a | `report-view.helpers.ts` (3L: `formatDate`), `report-view-tab-bar.tsx` (36L: `TabBar` + `ReportViewTab`), `report-view-header.tsx` (53L: `ReportHeader` com metaItems/courtLabel); `ReportPage.view.tsx` 186→110 (transitório). Commit `56c1c0a` | Concluído |
| 2026-10-16 | UI-24b | `report-view-stats.tsx` (42L: `ReportStats`+`StatCard`+`MiniStat`), `report-view-timeline.tsx` (50L: `IntegrityNotice`+`ReportTimeline`); `ReportPage.view.tsx` 110→**39** (dispatcher de abas; nome `.view.tsx` mantido). Commit `fcb6eea` | Concluído |
| 2026-10-16 | UI-24 DoD | `typecheck` verde · suítes ReportPage.view + report-page: 2 suites/6 testes verdes · **R-03 ✓**: view 39, timeline 50, stats 42, header 53, tab-bar 36, helpers 3 | Concluído |
| 2026-10-16 | UI-25 | Fatia única: `game-errors-histogram.logic.ts` (59L: `computeHistogramLayout`/`computeGameSlot` puros), `game-errors-histogram-slot.tsx` (100L: slot SVG por game), `game-errors-histogram-legend.tsx` (37L: header/footer); `GameErrorsHistogram.tsx` 184→**68**. Commit `854538e` | Concluído |
| 2026-10-16 | UI-25 DoD | `typecheck` verde · suítes GameErrorsHistogram + SetSummaryModal: 2 suites/8 testes verdes · **R-03 ✓**: 68, 59, 100, 37 | Concluído |
| 2026-10-16 | UI-26 | Fatia única: `match-details-section-fields.tsx` (72L: `DetailsField`/`DetailTextInput`/`DetailTextarea`), `match-details-section-weather.tsx` (44L: `WeatherFields`); `MatchDetailsSection.tsx` 178→**90** (7 seções → composição declarativa). Commit `8329e9e` | Concluído |
| 2026-10-16 | UI-26 DoD | `typecheck` verde · suítes MatchDetailsSection + NewMatchPage: 3 suites/19 testes verdes · **R-03 ✓**: 90, 72, 44 | Concluído |
| 2026-10-16 | R-03 rodada | **DoD final da rodada UI-21..26**: `typecheck` verde (exit 0) · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **backlog R-03: 24 → 18 arquivos `.tsx` de produção >100L** | Concluído |
| 2026-10-16 | UI-27 | Fatia única: `use-point-details-modal.ts` (92L: estado/refs/callbacks do modal), `use-point-details-section-refs.ts` (47L: 8 refs + `usePointDetailsScroll`); `PointDetailsModal.tsx` 176→**86** (shell portal + composição). Commit `b67b6a3` | Concluído |
| 2026-10-16 | UI-27 DoD | `typecheck` verde · suítes PointDetailsModal + telemetry-integrity: 3 suites/69 testes verdes · **R-03 ✓**: 86, 92, 47 | Concluído |
| 2026-10-16 | UI-28 | Fatia única: `ranking-form.types.ts` (21L), `ranking-form-fields.tsx` (100L: Categoria/Classe/Posição/Juvenil), `ranking-form-card.tsx` (81L: card por tipo com checkbox/Remover); `RankingForm.tsx` 175→**32**. Commit `f7b884a` | Concluído |
| 2026-10-16 | UI-28 DoD | `typecheck` verde · suítes RankingForm/ranking: 2 suites/45 testes verdes · **R-03 ✓**: 32, 81, 100, 21 | Concluído |
| 2026-10-16 | UI-29 | Fatia única: `scoring-play-area.types.ts` (29L), `scoring-play-area-players.tsx` (70L: linha dos dois PlayerCards + divisor); `ScoringPlayArea.tsx` 169→**98** — **guardião telemetry respeitado**: wrappers `flex-shrink-0` + `<ScoreboardCard`/`<LiveCountersBar` inline, token `telemetry-` no banner final. Commit `7c12fcf` | Concluído |
| 2026-10-16 | UI-29 DoD | `typecheck` verde · suítes telemetry-integrity + scoring.page.characterization + dual-theme: 3 suites/38 testes verdes · **R-03 ✓**: 98, 70, 29 | Concluído |
| 2026-10-16 | UI-30 | Fatia única: `player-card.types.ts` (40L), `player-card.logic.ts` (44L: `formatScore`/`getGameProgress` puros), `use-player-card-touch.ts` (32L: swipe/toque preservando semântica de refs por render); `PlayerCard.tsx` 159→**56** — guardião: `PlayerCard.view.tsx`/`PlayerCard.helpers.ts` não criados. Commit `9bff3fc` | Concluído |
| 2026-10-16 | UI-30 DoD | `typecheck` verde · suítes PlayerCard + telemetry-integrity: 5 suites/38 testes verdes · **R-03 ✓**: 56, 44, 40, 32 | Concluído |
| 2026-10-16 | UI-31 | Fatia única: `athlete-list-table.helpers.ts` (21L: `formatBirthDate`/`formatRankings`), `athlete-list-table-empty.tsx` (13L), `athlete-list-table-row.tsx` (81L); `AthleteListTable.tsx` 157→**44** (reusa `atletas.types`). Commit `90db474` | Concluído |
| 2026-10-16 | UI-31 DoD | `typecheck` verde · suite atletas characterization: 1 suite/12 testes verdes · **R-03 ✓**: 44, 81, 21, 13 | Concluído |
| 2026-10-16 | R-03 rodada | **DoD final da rodada UI-27..31**: `typecheck` verde (exit 0) · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **backlog R-03: 18 → 13 arquivos `.tsx` de produção >100L** | Concluído |
| 2026-10-16 | UI-32 | Fatia única: `section-renderer.logic.ts` (34L: `computeSectionRenderer` puro), `point-details-cascade-sections.tsx` (94L: seções 4-7 sem `vencedor`); `SectionRenderer.tsx` 156→**69**. Commit `29bdf51` | Concluído |
| 2026-10-16 | UI-32 DoD | `typecheck` verde · suítes PointDetailsModal + point-details-logic + telemetry-integrity: 5 suites/115 testes verdes · **R-03 ✓**: 69, 94, 34 | Concluído |
| 2026-10-16 | UI-33 | Fatia única: `use-new-athlete-modal.ts` (89L: estados, `useAge`, auto-categoria, `handleSubmit` com validate/build/playersClient); `NewAthleteModal.tsx` 155→**83** — foco do input preservado via dependência `[isOpen]`. Commit `404a8ba` | Concluído |
| 2026-10-16 | UI-33 DoD | `typecheck` verde · suítes NewAthleteModal (modal + characterization): 2 suites/38 testes verdes · **R-03 ✓**: 83, 89 | Concluído |
| 2026-10-16 | UI-34 | Fatia única: `use-date-time-schedule-modal.ts` (41L: efeito de agendamento + handlers de foco), `date-time-picker-input.tsx` (28L: input compartilhado com `showPicker` try/catch — deduplica date/time), `schedule-confirm-modal.tsx` (55L); `DateTimeSection.tsx` 154→**60**. Commit `8349298` | Concluído |
| 2026-10-16 | UI-34 DoD | `typecheck` verde · suítes NewMatchPage + schedule-check: 2 suites/19 testes verdes · **R-03 ✓**: 60, 55, 41, 28 | Concluído |
| 2026-10-16 | UI-35 | Fatia única: `confirm-alert-dialog.logic.ts` (31L: `trapFocusWithin` + `resolveConfirmClasses`), `confirm-alert-dialog.content.tsx` (77L: conteúdo do alertdialog via portal); `ConfirmAlertDialog.tsx` 134→**90** — API pública preservada. Commit `0695024` | Concluído |
| 2026-10-16 | UI-35 DoD | `typecheck` verde · suite ConfirmAlertDialog: 1 suite/10 testes verdes · **R-03 ✓**: 90, 77, 31 | Concluído |
| 2026-10-16 | UI-36 | Fatia única: `sport-format-sport-field.tsx` (44L: select esporte + auto-focus), `sport-format-format-field.tsx` (48L: select formato + hint deduplicado), `sport-format-court-field.tsx` (43L: grid de quadras); `SportFormatSection.tsx` 128→**33**. Commit `a2d4449` | Concluído |
| 2026-10-16 | UI-36 DoD | `typecheck` verde · suítes SportFormatSection (2 suites): 2 suites/9 testes verdes · **R-03 ✓**: 33, 48, 44, 43 | Concluído |
| 2026-10-16 | UI-37 | Fatia única: `use-login-form.ts` (62L: validação Zod, cookie de role, roteamento por role, mapeamento de erros), `login-form-fields.tsx` (42L: identifier + password); `login/page.tsx` 124→**39**. Commit `8f2ea28` | Concluído |
| 2026-10-16 | UI-37 DoD | `typecheck` verde · suítes login characterization: 3 suites/11 testes verdes · **R-03 ✓**: 39, 62, 42 | Concluído |
| 2026-10-16 | UI-38 | Fatia única: `audio-note-player.logic.ts` (6L: `formatDuration`), `use-audio-note-player.ts` (94L: fetch de blob, objectURL, abort, playback); `AudioNotePlayer.tsx` 123→**39**. Commit `1b42388` | Concluído |
| 2026-10-16 | UI-38 DoD | `typecheck` verde · suite AudioNotePlayer characterization: 1 suite/2 testes verdes · **R-03 ✓**: 39, 94, 6 | Concluído |
| 2026-10-16 | UI-39 | Fatia única: `MatchNewFormSections.tsx` (93L: seções do form via `ReturnType<typeof useNewMatchController>`); `match/new/page.tsx` 121→**40**. Commit `db946a2` | Concluído |
| 2026-10-16 | UI-39 DoD | `typecheck` verde · suite NewMatchPage: 1 suite/13 testes verdes · **R-03 ✓**: 40, 93 | Concluído |
| 2026-10-16 | UI-40 | Fatia única: `live-counters-grid.tsx` (86L: grid 4 células com `StatCell` genérico); `LiveCountersBar.tsx` 121→**74** — guardião telemetry: token `telemetry-` mantido no principal, sem `bg-gray-800/900`. Commit `329d63b` | Concluído |
| 2026-10-16 | UI-40 DoD | `typecheck` verde · suítes LiveCounters + telemetry-integrity + design-pattern: 3 suites/22 testes verdes · **R-03 ✓**: 74, 86 | Concluído |
| 2026-10-16 | UI-41 | Fatia única: `timeline-filter-chip.tsx` (36L: `Chip` + `COLOR_MAP`); `timeline-filters.tsx` 110→**74** (export `FilterCounts` preservado). Commit `0b07e3b` | Concluído |
| 2026-10-16 | UI-41 DoD | `typecheck` verde · suítes timeline/Timeline: 17 suites/167 testes verdes · **R-03 ✓**: 74, 36 | Concluído |
| 2026-10-16 | UI-42 | Fatia única: `use-theme-provider-state.ts` (79L: estado, efeitos de localStorage/matchMedia, `setTheme`); `ThemeContext.tsx` 103→**36** — API `ThemeProvider`/`useTheme`/`ThemePreference` preservada. Commit `91c5d4a` | Concluído |
| 2026-10-16 | UI-42 DoD | `typecheck` verde · suítes ThemeToggle: 2 suites/6 testes verdes · **R-03 ✓**: 36, 79 | Concluído |
| 2026-10-16 | UI-43 | Fatia única: `match-status-badge.tsx` (30L), `match-actions.tsx` (54L), `format-label.tsx` (13L); `match-card-components.tsx` 102→**3** (barrel de reexport — API de import preservada). Commit `25d7379` | Concluído |
| 2026-10-16 | UI-43 DoD | `typecheck` verde · suítes match-card-components + MatchCard: 6 suites/49 testes verdes · **R-03 ✓**: 3, 54, 30, 13 | Concluído |
| 2026-10-16 | UI-44 | Fatia única: `tournament-autocomplete-input.tsx` (50L: input + dropdown de sugestões); `TournamentSection.tsx` 101→**82**. Commit `af705d5` | Concluído |
| 2026-10-16 | UI-44 DoD | `typecheck` verde · suítes NewMatchPage + RoundSelector + TournamentSection: 2 suites/38 testes verdes · **R-03 ✓**: 82, 50 | Concluído |
| 2026-10-16 | R-03 final | **DoD final da rodada UI-32..44**: `typecheck` verde (exit 0) · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **backlog R-03: 13 → 0 arquivos `.tsx` de produção >100L** (193 arquivos medidos; testes excluídos) | Concluído |
| 2026-10-16 | R-02 A | Renomear 39 arquivos `*helpers*`/`*utils*` → `*.logic.ts`/`*-domain.ts` (route.logic, scoring-domain, edit-score.logic, match-card.logic, api.logic, snapshot.logic, etc.) + atualizar 125 arquivos com imports. Commit `8c2f809` | Concluído |
| 2026-10-16 | R-02 B | Renomear 11 funções `process*` → `apply*` no domínio de scoring (`processPoint`→`applyPoint`, `processRegularPoint`→`applyRegularPoint`, `processTiebreakPoint`→`applyTiebreakPoint`, `processMatchTiebreak`→`applyMatchTiebreak`, etc.); método privado do engine renomeado para `applyResolvedPoint` para evitar colisão. Commit `c4deacf` | Concluído |
| 2026-10-16 | R-02 C | Renomear 98 funções `handle*` → verbos canônicos de domínio (`handleApiError`→`reportApiError`, `handleSubmit`→`submitFormPayload`, `handleMatchClick`→`openMatchDetails`, `handleConfirm`→`confirmCurrentAction`, etc.) em 139 arquivos (1035 substituições). Commit `b8d1b4e` | Concluído |
| 2026-10-16 | R-02 DoD | `typecheck` verde (exit 0) · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 (26/26) · `lint` 0 erros (exit 0) · **auditoria final: 0 `handle*`/`process*`/`manage*`/`doAction`/arquivos `*helper*`/`*utils*` em produção** | Concluído |

> **Status Fase UI-1: CONCLUÍDA.** `MatchTimelineView.tsx` 535 → 96 linhas (R-03 ✓), 6 commits atômicos.
> **Status Fase UI-2: CONCLUÍDA.** `MatchCard.tsx` 409 → 86 linhas (R-03 ✓), 4 commits atômicos (`ecadac2`, `40951dd`, `057e3fb`, `bc72bbd`).
> **Status Fase UI-3: CONCLUÍDA.** `EditMatchInfoModal.tsx` 370 → 97 linhas (R-03 ✓), 2 commits atômicos (`b2dd8de`, `f18ae3c`).
> **Status Fase UI-4: CONCLUÍDA.** `timeline-rows.tsx` 342 → 81 linhas (R-03 ✓), 4 commits atômicos (`7e1a2ac`, `69065db`, `55571ae`, `b51681d`).
> **Status Fase UI-5: CONCLUÍDA.** `scoring/page.tsx` 339 → 94 linhas (R-03 ✓), 4 commits atômicos (`69e50d5`, `914a245`, `087d5c9`, `a66caf2`).
> **Status Fase UI-6: CONCLUÍDA.** `dashboard/page.tsx` 337 → 69 linhas (R-03 ✓), 5 commits atômicos (`20ddd92`, `9649b49`, `9331a37`, `2000533`, `93a6cda`).
> **Status Fase UI-7: CONCLUÍDA.** `SetSummaryModal.tsx` 327 → 91 linhas (R-03 ✓), 4 commits atômicos (`9ba9637`, `58db88a`, `81d2b38`, `c102365`).
> **Status Fase UI-8: CONCLUÍDA.** `AdvancedStats.tsx` 316 → 23 linhas (R-03 ✓), 3 commits atômicos (`8b043d0`, `642debd`, `3f257a2`).
> **Status Fase UI-9: CONCLUÍDA.** `edit-score-form.tsx` 320 → 60 linhas (R-03 ✓), 4 commits atômicos (`a44be2b`, `6837987`, `a686252`, `7ad8963`).
> **Status Fase UI-10: CONCLUÍDA.** `CommentModal.tsx` 293 → 47 linhas (R-03 ✓), 2 commits atômicos (`a847e75`, `4bee199`).
> **Status Fase UI-11: CONCLUÍDA.** `EditScoreModal.tsx` 261 → 65 linhas (R-03 ✓), 5 commits (`f9ee743`, `e204f00`, `0933b49`, `33b845a`, `a9ed92f`).
> **Status Fase UI-12: CONCLUÍDA.** `ScoreboardCard.tsx` 250 → 72 linhas (R-03 ✓), 3 commits (`5ae6247`, `a52a229`, `ba9e552`) — com restrição do guardião telemetry respeitada.
> **Status Fase UI-13: CONCLUÍDA.** `admin/page.tsx` 249 → 77 linhas (R-03 ✓), 2 commits (`50f58a3`, `2171843`).
> **Status Fase UI-14: CONCLUÍDA.** `DashboardViewRouter.tsx` 241 → 98 linhas (R-03 ✓), 2 commits (`83b4c5f`, `bc4c709`).
> **Status Fase UI-15: CONCLUÍDA.** `SessionContext.tsx` 238 → 98 linhas (R-03 ✓), 2 commits (`e7c6d51`, `edfd783`).
> **Status Fase UI-16: CONCLUÍDA.** `NewAthleteModalForm.tsx` 235 → 60 linhas (R-03 ✓), 2 commits (`0fd1903`, `27a26b7`).
> **Status Fase UI-17: CONCLUÍDA.** `ServerEffectModal.tsx` 235 → 95 linhas (R-03 ✓), 2 commits (`611b083`, `1fc57af`) — guardião telemetry respeitado.
> **Status Fase UI-18: CONCLUÍDA.** `edit-score-summary.tsx` 216 → 92 linhas (R-03 ✓), 1 commit (`50b89b6`).
> **Status Fase UI-19: CONCLUÍDA.** `EditAthleteModal.tsx` 215 → 97 linhas (R-03 ✓), 1 commit (`f3bb5a1`).
> **Status Fase UI-20: CONCLUÍDA.** `locate/page.tsx` 206 → 72 linhas (R-03 ✓), 2 commits (`eb1c5f7`, `0f7ec5a`).
> **Status Fase UI-21: CONCLUÍDA.** `ScoringModals.tsx` 203 → 91 linhas (R-03 ✓), 1 commit (`7abcca2`).
> **Status Fase UI-22: CONCLUÍDA.** `PointDetailsNotesModal.tsx` 201 → 84 linhas (R-03 ✓), 1 commit (`0fbcd9b`).
> **Status Fase UI-23: CONCLUÍDA.** `atletas/page.tsx` 197 → 82 linhas (R-03 ✓), 1 commit (`e933493`).
> **Status Fase UI-24: CONCLUÍDA.** `ReportPage.view.tsx` 186 → 39 linhas (R-03 ✓), 2 commits (`56c1c0a`, `fcb6eea`) — nome `.view.tsx` mantido (fora do guardião; consumidores mockam o arquivo).
> **Status Fase UI-25: CONCLUÍDA.** `GameErrorsHistogram.tsx` 184 → 68 linhas (R-03 ✓), 1 commit (`854538e`).
> **Status Fase UI-26: CONCLUÍDA.** `MatchDetailsSection.tsx` 178 → 90 linhas (R-03 ✓), 1 commit (`8329e9e`).
> **Status Fase UI-27: CONCLUÍDA.** `PointDetailsModal.tsx` 176 → 86 linhas (R-03 ✓), 1 commit (`b67b6a3`).
> **Status Fase UI-28: CONCLUÍDA.** `RankingForm.tsx` 175 → 32 linhas (R-03 ✓), 1 commit (`f7b884a`).
> **Status Fase UI-29: CONCLUÍDA.** `ScoringPlayArea.tsx` 169 → 98 linhas (R-03 ✓), 1 commit (`7c12fcf`) — guardião telemetry respeitado (wrappers `flex-shrink-0` + ScoreboardCard/LiveCountersBar inline).
> **Status Fase UI-30: CONCLUÍDA.** `PlayerCard.tsx` 159 → 56 linhas (R-03 ✓), 1 commit (`9bff3fc`) — nomes proibidos `PlayerCard.view.tsx`/`PlayerCard.helpers.ts` não criados.
> **Status Fase UI-31: CONCLUÍDA.** `AthleteListTable.tsx` 157 → 44 linhas (R-03 ✓), 1 commit (`90db474`).
> **Status Fase UI-32: CONCLUÍDA.** `SectionRenderer.tsx` 156 → 69 linhas (R-03 ✓), 1 commit (`29bdf51`).
> **Status Fase UI-33: CONCLUÍDA.** `NewAthleteModal.tsx` 155 → 83 linhas (R-03 ✓), 1 commit (`404a8ba`).
> **Status Fase UI-34: CONCLUÍDA.** `DateTimeSection.tsx` 154 → 60 linhas (R-03 ✓), 1 commit (`8349298`).
> **Status Fase UI-35: CONCLUÍDA.** `ConfirmAlertDialog.tsx` 134 → 90 linhas (R-03 ✓), 1 commit (`0695024`).
> **Status Fase UI-36: CONCLUÍDA.** `SportFormatSection.tsx` 128 → 33 linhas (R-03 ✓), 1 commit (`a2d4449`).
> **Status Fase UI-37: CONCLUÍDA.** `login/page.tsx` 124 → 39 linhas (R-03 ✓), 1 commit (`8f2ea28`).
> **Status Fase UI-38: CONCLUÍDA.** `AudioNotePlayer.tsx` 123 → 39 linhas (R-03 ✓), 1 commit (`1b42388`).
> **Status Fase UI-39: CONCLUÍDA.** `match/new/page.tsx` 121 → 40 linhas (R-03 ✓), 1 commit (`db946a2`).
> **Status Fase UI-40: CONCLUÍDA.** `LiveCountersBar.tsx` 121 → 74 linhas (R-03 ✓), 1 commit (`329d63b`) — guardião telemetry respeitado.
> **Status Fase UI-41: CONCLUÍDA.** `timeline-filters.tsx` 110 → 74 linhas (R-03 ✓), 1 commit (`0b07e3b`).
> **Status Fase UI-42: CONCLUÍDA.** `ThemeContext.tsx` 103 → 36 linhas (R-03 ✓), 1 commit (`91c5d4a`).
> **Status Fase UI-43: CONCLUÍDA.** `match-card-components.tsx` 102 → 3 linhas (R-03 ✓; barrel), 1 commit (`25d7379`).
> **Status Fase UI-44: CONCLUÍDA.** `TournamentSection.tsx` 101 → 82 linhas (R-03 ✓), 1 commit (`af705d5`).
>
> **Status R-03: CONCLUÍDO** (2026-10-16). Meta de nenhum `.tsx` de produção >100 linhas atingida (backlog 53 → 0; 193 arquivos medidos; testes excluídos).
> **Status R-02: CONCLUÍDO** (2026-10-16). Nomenclatura proibida eliminada de produção (39 arquivos renomeados, 98 funções renomeadas; auditoria final: 0 violações).
> **Status R-23 (P1): CONCLUÍDO** (2026-10-16). Cluster save/create/submit + duplicações normalizados: `getGamePointCount` vs `getGameProgressRatio` (desambiguação de `getGameProgress`), `submitFormPayload` padronizado por domínio (`submitLoginForm`, `submitMatchInfoForm`, `submitNewAthleteForm`, `submitNewMatchForm`), `persistFormChanges` tipado por domínio (`saveAthleteChanges`, `saveEditedAthlete`, `saveComment`, `savePointNotes`), `confirmMatchDeletion` corrigido para `confirmAthleteDeletion`, `confirmCurrentAction` contextualizado (`confirmServerEffect`, `confirmPointDetails`, `confirmScheduleModal`), e `useNotesModal` com verbos canônicos (`saveNotes`, `clearNotes`, `canSubmitNotes`). Commit `d92f763`.
> **Status R-02/R-23 (P3): CONCLUÍDO** (2026-10-16). Resíduos de Handler/Helpers em hooks e services de scoring eliminados: `useScoringComment.ts` (função `useScoringComment`), `useScoringEditScore.ts` (função `useScoringEditScore`), `createServerResolutionService` e `createScoringModalsService` canônicos com aliases compatíveis preservados para backward compatibility de characterization tests.
>
> **Pendências do plano:**
> 1. ~~**R-01** — recriar `docs/glossario.md`~~ — **CONCLUÍDO** (UTF-8 limpo, 147 linhas).
> 2. ~~**R-03 backlog** — `.tsx` de produção >100 linhas~~ — **CONCLUÍDO** (0 arquivos; medido 2026-10-16 pós UI-44).
> 3. ~~**R-02** — nomenclatura proibida~~ — **CONCLUÍDO** (0 violações; medido 2026-10-16 pós Fase C).
> 4. ~~**R-23 (P1/P3 cluster save/create/submit + resíduos de hooks)**~~ — **CONCLUÍDO** (DoD: typecheck ✓ · test:strict 296/296 ✓ · test:design 3/3 ✓ · lint ✓).
> 5. **R-12 — Tokens de Design System e Telemetry**: substituir 28 hexadecimais soltos e 14 rgba soltos por tokens semânticos em `app/globals.css` / classes canônicas de Tailwind.
> 6. **R-13 — Acessibilidade (A11y)**: P0, P1, P2 em modais, botões de ícone e controles de formulário.




