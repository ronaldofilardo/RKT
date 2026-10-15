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
- [x] `pnpm test:strict` verde ao fim de cada fase — Fases 1, 2, 3, UI-1, UI-2, UI-3 e UI-4 (291/294, baseline).
- [x] `pnpm test:design` verde ao fim da Fase 2 — 3/3 suites, 26/26 testes.
- [x] `docs/glossario.md` criado com termos mapeados (R-01) — recriado em UTF-8 limpo (147 linhas; o anterior tinha mojibake).
- [x] Toda exceção registrada via `// ste-exception R-XX: <motivo>` — Fase 1 (7× R-08).
- [~] Nenhum arquivo UI/componente >100 linhas (R-03) — **parcial**: `MatchTimelineView.tsx` 535→96 ✓, `MatchCard.tsx` 409→86 ✓, `EditMatchInfoModal.tsx` 370→97 ✓, `timeline-rows.tsx` 342→81 ✓; restam **41 arquivos `.tsx` de produção** >100L (backlog; testes excluídos).


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

> **Status Fase UI-1: CONCLUÍDA.** `MatchTimelineView.tsx` 535 → 96 linhas (R-03 ✓), 6 commits atômicos.
> **Status Fase UI-2: CONCLUÍDA.** `MatchCard.tsx` 409 → 86 linhas (R-03 ✓), 4 commits atômicos (`ecadac2`, `40951dd`, `057e3fb`, `bc72bbd`).
> **Status Fase UI-3: CONCLUÍDA.** `EditMatchInfoModal.tsx` 370 → 97 linhas (R-03 ✓), 2 commits atômicos (`b2dd8de`, `f18ae3c`).
> **Status Fase UI-4: CONCLUÍDA.** `timeline-rows.tsx` 342 → 81 linhas (R-03 ✓), 4 commits atômicos (`7e1a2ac`, `69065db`, `55571ae`, `b51681d`).
> **Pendências do plano:**
> 1. ~~**R-01** — recriar `docs/glossario.md`~~ — **CONCLUÍDO** (UTF-8 limpo, 147 linhas).
> 2. **R-03 backlog** — **41 arquivos `.tsx` de produção** ainda >100 linhas (medido 2026-10-15, testes excluídos). Maiores: `scoring/page.tsx` 339, `dashboard/page.tsx` 337, `SetSummaryModal.tsx` 327, `edit-score-form.tsx` 320, `AdvancedStats.tsx` 316, `CommentModal.tsx` 293.
> 3. Ordem sugerida: `scoring/page.tsx` (339) → `dashboard/page.tsx` (337) → `SetSummaryModal.tsx` (327) → `AdvancedStats.tsx` (316) → formulários `edit-score-form.tsx`/`EditScoreModal.tsx`. Padrão de referência: UI-1 (timeline-*), UI-2 (match-card-*), UI-3 (edit-match-info-*), UI-4 (timeline-rows-*).



