# Plano R-03 — Top-10 da Fase 3/S3 e Backlog >100L

> **Data:** 2026-10-22 · **Status:** EM EXECUÇÃO (Fase A-0)
> **Regra-mãe:** R-03 (nenhum arquivo de produção >100 linhas) · Protocolo: `docs/PLANO_REFATORACAO_STEDEV.md` §4/§7.
> **Fonte:** continuação direta da Fase 3/S3 do plano STE-DEV (auditoria §7 100% executada; R-07 e R-12 fechados).

---

## 0. Estado atual medido (2026-10-22, leitura)

### 0.1 Reconferência de contagem (Passo A-0)

| Métrica | Plano STE-DEV §7.2 | Medição 2026-10-22 |
|---|---|---|
| Arquivos produção >100L | **106** (.ts + .tsx) | **124** (108 `.ts` + 16 `.tsx`) |

Divergência de 18 arquivos — métodos de contagem distintos. **Passo A-0:** congelar varredura canônica (comando registrado abaixo), reconciliar números, publicar baseline oficial.

#### ✅ A-0 CONCLUÍDO (2026-10-22) — Reconciliação

Dois métodos alternativos reproduzem exatamente **106**, mas com conjuntos **diferentes** (interseção 91, 15 exclusivos em cada) — coincidência numérica:

| Método | Contagem | Resultado |
|---|---|---|
| Linhas cruas (`wc -l` / `ReadAllLines`) | 124 | 108 `.ts` + 16 `.tsx` |
| Sem linhas em branco (SLOC) | **106** | provável método do plano original |
| Crua, excluindo `*.service/*.logic/*.types.ts` | **106** | hipótese alternativa (conjunto diferente) |
| Sem branco nem comentários/vazios | 99 | — |

**Baseline oficial adotado: 124 (linhas cruas)** — métrica conservadora, igual a `wc -l`, usada por ferramentas padrão. Os "106" do plano STE-DEV §7.2 são reconciliados como contagem SLOC (sem linhas em branco); nenhum arquivo novo violou desde a auditoria (0 arquivos >100L tocados desde 2026-10-21).

**Varredura canônica** (exclui `__tests__`, `*.test.*`, `*.d.ts`):

```powershell
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch '__tests__|\.test\.|node_modules|\.d\.ts$' } |
  ForEach-Object { $n = [System.IO.File]::ReadAllLines($_.FullName).Count;
    if ($n -gt 100) { [PSCustomObject]@{ Lines = $n; Path = $_.FullName } } } |
  Sort-Object Lines -Descending
```

> **Decisão de medição:** R-03 usa linhas cruas > 100 (arquivos de exatamente 100L estão conformes). Detalhe da fronteira: 4 arquivos com exatamente 100L (conformes), 22 entre 98–102L (zona de risco de regressão — a guarda A-1 alerta nessa faixa).

### 0.2 Regressão do `.tsx` (achado novo)

Backlog `.tsx` zerado em 2026-10-16 (53→0); hoje **16 `.tsx` >100L**:

- **Cresceram pós-UI-44:** `ScoringModals.tsx` (91→109), `PlayerCard.tsx` (56→111), `MatchTimelineView.tsx` (96→108), `timeline-point-row.tsx` (87→109), `ScoringPlayArea.tsx` (98→102), `comment-modal-body.tsx` (97→102), `EditAthleteModal.tsx` (97→102).
- **Novos/fora da rodada UI:** `DoublesServerSelectionModal.tsx` (261), `DoublesArrangementModal.tsx` (243), `ActionBar.sections.tsx` (190), `PlayerSelection.tsx` (189), `point-details-breadcrumb.tsx` (108), `DashboardMatchModals.tsx` (106), `MatchNewFormSections.tsx` (105), `AthleteDropdown.tsx` (104), `ScoringPlayArea` já listado.

**Conclusão:** R-03 sem guarda de crescimento regride. Fase A (contenção) precede as fatias.

### 0.3 Top-10 original — situação real

| # | Arquivo | Audit 10-22 | Hoje | Status |
|---|---|---|---|---|
| 1 | `useScoringHandlers.ts` | 338 | **288** | Fatias 1a/1b feitas (`arrangement.service` 74L, `persist` 78L) |
| 2 | `use-edit-score-calculator.ts` | 313 | **150** | Epic #2 feito; `ste-exception R-03` declarada |
| 3 | `matchValidator.ts` | 310 | **191** | 3a/3b feitos; ainda >100 |
| 4 | `core/scoring/edit-score-domain.ts` | 297/345 | **51** | ✅ **B-1 feito** — fatiado em 5 módulos `edit-score-*` (345→51L) |
| 5 | `matchService.ts` | 283 | **24** | ✅ **B-2 feito** — fachada de re-exports; 6 módulos `match-service-*.service/logic` novos |
| 6 | `useScoringHandlers.point-processor.service.ts` | 272 | **289** | Envelope extraído; ainda >100 |
| 7 | `schemas/match.ts` | 272 | **298** | `ste-exception R-03` declarada (schema declarativo) |
| 8 | `useOfflineSync.ts` | 268 | **158** | Split #8 feito; ainda >100 |
| 9 | `DoublesServerSelectionModal.tsx` | 263 | **261** | Hook extraído; JSX quase não reduziu |
| 10 | `useScoringHandlers.serve-actions.service.ts` | 249 | **240** | Corte #10 feito; ainda >100 |

**Nenhum dos 10 chegou a ≤100L.** Exceções ativas: #2 e #7 (só 2 no projeto).

### 0.4 Top do backlog fora do top-10

`point/route.ts` (44 ✅ B-3), `rankingConstants.ts` (318), `engine.ts` (316), `matches/[id]/route.ts` (299), `use-edit-score-modal-submission.logic.ts` (290), `useScoringPageDerived.ts` (289), `useScoringPageState.ts` (283), `edit-score-state.ts` (281).

---

## 1. Fases

### Fase A — Contenção (bloqueia regressão)

| Fatia | Ação | Aceite |
|---|---|---|
| **A-0** | Congelar varredura canônica; reconciliar 106 vs 124; registrar baseline em §7.5 do plano STE-DEV | ✅ Comando + número oficiais publicados |
| **A-1** | Guarda R-03 (ratchet no CI): falha se arquivo produção >100L e fora do baseline, se cresceu, ou baseline obsoleto; `ste-exception R-03` no cabeçalho isenta | ✅ Exit 1 nas 3 falhas simuladas, exit 0 no estado limpo |
| **A-2** | Triagem dos 16 `.tsx`: "cresceu pós-UI-44" vs "novo" | ✅ Tabela abaixo; regressão vira lote C-0 |

#### ✅ A-2 CONCLUÍDO (2026-10-22) — Triagem dos 16 `.tsx` >100L

Comparação vs `af705d5` (zeramento UI-44, 2026-10-16):

| Classe | Arquivo | 16-10 | Hoje | Δ | Causa-raiz |
|---|---|---|---|---|---|
| **Novo** (não existia) | `DoublesServerSelectionModal.tsx` | — | 261 | — | feature duplas `8479c4e` |
| **Novo** | `DoublesArrangementModal.tsx` | — | 243 | — | feature duplas `8479c4e` |
| **Novo** | `point-details-breadcrumb.tsx` | — | 108 | — | Stitch `0cd303a` (10-17) |
| **Cresceu** | `ActionBar.sections.tsx` | 46 | 190 | **+144** | Stitch `0cd303a` (10-17) |
| **Cresceu** | `PlayerSelection.tsx` | 64 | 189 | **+125** | duplas `8479c4e` |
| **Cresceu** | `PlayerCard.tsx` | 56 | 111 | +55 | duplas `8479c4e` |
| **Cresceu** | `edit-match-info-sections.tsx` | 98 | 115 | +17 | `24691e8` (10-17) |
| **Cresceu** | `timeline-point-row.tsx` | 86 | 109 | +23 | duplas `8479c4e` |
| **Cresceu** | `ScoringModals.tsx` | 91 | 109 | +18 | duplas `8479c4e` |
| **Cresceu** | `MatchTimelineView.tsx` | 100 | 108 | +8 | duplas `8479c4e` |
| **Cresceu** | `DashboardMatchModals.tsx` | 93 | 106 | +13 | duplas `8479c4e` |
| **Cresceu** | `MatchNewFormSections.tsx` | 93 | 105 | +12 | duplas `8479c4e` |
| **Cresceu** | `AthleteDropdown.tsx` | 97 | 104 | +7 | duplas `8479c4e` |
| **Cresceu** | `ScoringPlayArea.tsx` | 98 | 102 | +4 | duplas `8479c4e` |
| **Cresceu** | `EditAthleteModal.tsx` | 97 | 102 | +5 | `6804705` (10-16) |
| **Cresceu** | `comment-modal-body.tsx` | 97 | 102 | +5 | `6804705` (10-16) |

**Achado-chave:** 9 dos 13 "cresceram" + os 2 novos grandes regrediram no **commit de feature duplas `8479c4e` (2026-10-22)** — feature entregue no mesmo dia da auditoria, **antes** da guarda A-1. O ratchet agora impede repetição. Lote **C-0 = os 16 `.tsx`** (prioridade máxima da Fase C).

### Fase B — Top-10 (1 fatia = 1 arquivo)

Ordem por valor/risco (não por posição na tabela):

| Ordem | Alvo | Hoje → Meta | Ação | R-15 (characterization) |
|---|---|---|---|---|
| **B-1** ✅ | `core/scoring/edit-score-domain.ts` | 345 → **51** | Dividir por responsabilidade (validação de resultado, limites de games, tiebreak, próximo sacador) → `core/scoring/edit-score-*` c/ re-exports | `editScoreHelpers.characterization` ✓ |
| **B-2** ✅ | `matchService.ts` | 304 → **24** | Nova(s) fatia(s) → `match-service-*.logic.ts` (padrão doubles 27L / create 104L / operations 234L) | `matchService.characterization` + `doubles-undo` ✓ |
| **B-3** ✅ | `point/route.ts` | 394 → **44** | Completar extração p/ `point/route.logic.ts` (já 267L) — **desvio justificado**: route.logic está no baseline (crescimento proibido), então 6 módulos novos `point/route-*.logic.ts` | characterization da rota ✓ (5 suítes / 37 testes) |
| **B-4** ✅ | `useScoringHandlers.ts` | 288 → **66** | 4 fatias: setup.service (9e16a0c) → services+processor-wiring (b98147d, split por guarda R-03) → state-bridge (fd08c0e) → finalize.service + ctx (a4951ce); callbacks inline no return (identidade já era recriada por render) | **Characterizations novas criadas antes de cada corte**: setup (4) + services (4) + state-bridge (3) ✓ |
| **B-5** ✅ | `DoublesServerSelectionModal.tsx` | 261 → **83** | 3 fatias: seções serving+ordem (`9ec1c80`) → recepção+botão (`14c3e3c`) → frame+ids no hook+destructure (`b450e52`); 5 children JSX puros | `DashboardMatchModals.doubles` ✓ + characterization nova de interações (6 testes: cliques das 3 seções via `buildConfirmation`) ✓ |
| **B-6** ✅ | `point-processor.service.ts` | 289 → **98** | 3 fatias: tipos+`applySuccessResult` (`fb9005b`) → `confirmPointDetails`+characterization (`a452a26`) → sync online/offline/retry+remoção da entrada baseline (`0591818`) | characterization prévia de `confirmPointDetails` (8 testes) + `point-processor.success-result` ✓ + regressão resync ✓ |
| **B-7** ✅ | `matchValidator.ts` | 191 → **61** | 2 fatias: finish/transições (`7599bda`, 191→104L) → doubles (`f8933d5`, remoção da entrada baseline) | `matchValidator.characterization` + 4 suítes (56 testes) ✓ |
| **B-8** ✅ | `serve-actions.service.ts` | 240 → **34** | 2 fatias: tipos+ACE (`d47954b`, 240→143L) → DOUBLE_FAULT×2+compositor (`890fbc1`, remoção da entrada baseline) | `serve-actions.characterization` (6 testes) ✓ + 21 suítes `useScoringHandlers` |
| **B-9** ✅ | `useOfflineSync.ts` | 158 → **63** | 2 fatias: fila→`use-offline-sync.queue`+baseline (`45a77a9`, 158→89L) → rede→`use-offline-sync.network` (`0af336c`) | suítes `useOfflineSync.*` (22 testes) + `useScoringPageState` ✓ |
| **B-10** ✅ | `useScoringPageDerived.ts` / `useScoringPageState.ts` (289/283) | → **81/99** | Derived em 3 fatias (flags+edit-score → display+types+baseline → active-players); State em 2 (characterization prévia 5 testes+types → local-state+sync-status+baseline) | characterization nova do shape (71 chaves) + `useScoringPageState.timeline.characterization` + 2 suítes Derived ✓ |

**Fora de B (exceções declaradas):** `use-edit-score-calculator.ts` (150), `schemas/match.ts` (298).

### Fase C — Backlog em lotes (pós-top-10)

- Método: por faixas (≥250 → 200-249 → 150-199 → 101-149), **≤3 arquivos por fatia**.
- **C-0 prioritário:** os 16 `.tsx` regressados (restaurar conquista 16-10).
- Meta: 124 → 0 (ou → nº de `ste-exception` justificadas, ideal ≤5).
- Recontagem oficial ao fim de cada faixa.

---

## 2. Protocolo por fatia (invariante)

1. Characterization prévia (R-15) se a suíte de gate do arquivo for baseline-failing.
2. Extrair; re-export preservado quando houver consumidores.
3. Gates: `pnpm typecheck` + suítes afetadas + guarda R-03 do alvo.
4. **Baseline inegociável:** 7 suítes / 25 testes falhando = mesmo conjunto de hoje (`useScoringHandlers.test`, `matchService.test`, `useScoringHandlers.server-helpers.service.test`, `api/matches/route`, `api/matches/[id]/route`, `timeline-rows.report-columns`, `match-authorization.baseline.characterization`).
5. Commit atômico + linha em §7.5 do plano STE-DEV.
6. Fim de cada faixa: `pnpm test:strict` completo confirmando baseline.

## 3. Riscos e decisões

| Item | Nota |
|---|---|
| Crescimento pós-extração (`matchService` 283→304) | Guarda da Fase A é o remédio |
| `useScoringHandlers` sem suíte verde principal | B-4 = fatia mais cara: characterization mockada primeiro |
| 16 `.tsx` regressados | Lote C-0 prioritário logo após A |
| Exceções | Só 2 ativas; nova exceção exige justificativa + §7.5 |
| `point/route.ts` fora do top-10 nominal mas é o maior (394) | Promovido a B-3 |

---

## 4. Registro de execução

| Data | Ação | Status |
|---|---|---|
| 2026-10-22 | Plano criado (`docs/PLANO_R03_TOP10_S3.md`) | Concluído |
| 2026-10-22 | **A-0** Varredura canônica congelada; reconciliação 106 (SLOC) vs 124 (linhas cruas = baseline oficial); 0 arquivos novos violando desde 2026-10-21; fronteira 98–102L mapeada (22 arquivos zona de risco) | Concluído |
| 2026-10-22 | **A-1** Guarda R-03 ratchet: `check-r03-line-limit.mjs` (novo arquivo >100L / crescimento / baseline obsoleto → exit 1; `ste-exception R-03` isenta), baseline com 122 violações congeladas, `pnpm check:r03`, passo no CI `quality.yml`; `ste-exception R-03` ausente em `schemas/match.ts` adicionada ao cabeçalho (exceção já registrada no plano STE-DEV §7.5); modos de falha testados (exit 1/1/0) | Concluído (`2f42d15`) |
| 2026-10-22 | **A-2** Triagem dos 16 `.tsx`: 3 novos (`DoublesServerSelectionModal` 261, `DoublesArrangementModal` 243, `point-details-breadcrumb` 108) + 13 que cresceram desde `af705d5` (maiores: `ActionBar.sections` 46→190, `PlayerSelection` 64→189, `PlayerCard` 56→111); **causa-raiz: 9/13 + 2 novos = feature duplas `8479c4e` (mesmo dia da auditoria, pré-guarda)**; lote C-0 definido = os 16 | Concluído (`332bab2`) |
| 2026-10-22 | **B-1** `edit-score-domain.ts` 345→**51L** em 4 commits atômicos: `edit-score-domain.types.ts` (16L, b649838) → `edit-score-match-tiebreak.ts` (62L) + `edit-score-set-guards.ts` (56L) (ea1c531) → `edit-score-standard-set.ts` (79L) (e94ea2b) → `edit-score-next-server.ts` (93L) + fachada (30e9db3); API pública preservada via re-exports (44 consumidores intactos); baseline r03 removida com diff = só remoção | Concluído (4 fatias, gates verdes em cada) |
| 2026-10-22 | **B-2** `matchService.ts` 304→**24L** em 3 fatias: B-2a `match-service-create.service` (25L) + `match-service-delete.service` (47L) (b895207); B-2b `match-service-update.service` (31L) + `match-service-finish.service` (69L) (cd912e7); B-2c `match-service-transition.service` (95L) + `match-service-voidpoint.logic` (38L, dedup dos 2 ramos de void) (0ca6a4e); fachada = só re-exports + `getMatchScoreEdits`; `matchService.test.ts` confirmada no baseline via stash (2f/32p idêntico pré-extração; falhas em `listMatches`/`getMatch`, não relacionadas); baseline r03 removida (120 restantes) | Concluído (3 fatias, gates verdes em cada) |
| 2026-10-22 | **B-3** `point/route.ts` 394→**44L** em 4 fatias: B-3a `route-load` (71L, idempotency+guards) + `route-sequence` (47L) (6d71196); B-3b `route-actors-doubles` (95L) + `route-actors-singles` (55L) (31e2234); B-3c+d `route-apply` (90L) + `route-pointlog` (77L) + `route-parse` (54L) + `route-transaction` (87L) (7f3c106, fatias encadeadas no mesmo route.ts); **desvio**: ação prevista "completar p/ route.logic.ts" não aplicável (baseline impedia crescimento) — 6 módulos `route-*.logic.ts` novos; characterization prévia 5 suítes/37 testes verdes antes de começar; baseline r03 removida (119 restantes) | Concluído (4 fatias, gates verdes em cada) |
| 2026-10-22 | **B-4** `useScoringHandlers.ts` 288→**66L** em 4 fatias: B-4a characterization `setup` (4 testes) + `setup.service` (9e16a0c); B-4b characterization `services` (4) + `services.ts` (core) + `processor-wiring.ts` (b98147d, split exigido pela guarda: juntos 123L); B-4c characterization `state-bridge` (3) + `state-bridge.ts` (refs/effects/subscription/fetch) (fd08c0e); B-4d `finalize.service` (serveActions+arrangement) + setup migra p/ `{ctx}` + callbacks inline + destructuring removido (a4951ce); baseline r03 removida (118 restantes, diff = só remoção); **checkpoint `test:strict`**: 7 falhas / 325 suítes / 25 testes / 3355 total = baseline + 3 suítes e 11 testes novos, zero regressão | Concluído (4 fatias, gates verdes em cada) |
| 2026-10-22 | **B-5** `DoublesServerSelectionModal.tsx` 261→**83L** em 3 fatias: B-5a characterization de interações (6 testes) + `doubles-serving-side-section` + `doubles-serve-order-section` (`9ec1c80`, 183L); B-5b `doubles-receive-side-section` + `doubles-confirm-button` (`14c3e3c`, 118L); B-5c `doubles-modal-frame` + ids derivados dentro de `use-doubles-server-selection` + destructure compacta (`b450e52`); baseline r03 removida (117 restantes, diff = só remoção); **checkpoint `test:strict`**: 7 falhas / 326 suítes / 25 testes / 3361 total = baseline + 4 suítes e 17 testes novos, zero regressão | Concluído (3 fatias, gates verdes em cada) |
| 2026-10-22 | **B-6** `useScoringHandlers.point-processor.service.ts` 289→**98L** em 3 fatias: B-6a `point-processor.types` + `point-processor.success.logic` (`fb9005b`, service 289→193L); B-6b characterization prévia de `confirmPointDetails` (8 testes: mapeamento tipo, rallyLength, firstFaultDetail, early-return, pós-processamento, áudio on/off) + `point-processor.details.logic` + `ConfirmPointDetailsDeps` em types (`a452a26`, 193→140L); B-6c `point-processor.sync.logic` com contrato `{handled, pointLogId}` preservando o early-return do success sem banner (`0591818`, 140→98L) + entrada baseline removida (117→116, diff = só remoção); gates por fatia: typecheck + check:r03 + 21 suítes `useScoringHandlers` (15 falhas = baseline); **checkpoint `test:strict`**: 7 falhas / 334 suítes / 25 falhas em 3369 testes = baseline + 1 suíte/8 testes novos, zero regressão | Concluído (3 fatias, gates verdes em cada) |
| 2026-10-22 | **B-7** `src/services/matchValidator.ts` 191→**61L** em 2 fatias: B-7a `match-validator-finish.logic` (ALLOWED_TRANSITIONS + validateFinishMatch + validateAllowedTransition + validateFinishedTransition; `7599bda`, 191→104L); B-7b `match-validator-doubles.logic` (serveOrder/serveIndex/receiveDeuce) + re-export pela fachada (`f8933d5`, 104→61L) + entrada baseline removida (116→115, diff = só remoção); gates por fatia: 5 suítes `matchValidator` (56 testes verdes) + `matchService` (2 falhas = baseline) | Concluído (2 fatias, gates verdes em cada) |
| 2026-10-22 | **B-8** `useScoringHandlers.serve-actions.service.ts` 240→**34L** em 2 fatias: B-8a `serve-actions.types` (ServeActionsDeps) + `serve-ace.logic` (recordAceDirectly + confirmServerEffect com debounce; `d47954b`, 240→143L); B-8b `serve-fault-confirm.logic` (confirmServeError) + `serve-fault-direct.logic` (recordDirectServeError), ambos com `cancelPendingDebounce` injetado, service vira compositor (`890fbc1`, 143→34L) + entrada baseline removida (115→114, diff = só remoção); gates por fatia: 21 suítes `useScoringHandlers` (15 falhas = baseline, inclui `serve-actions.characterization` 6 testes) | Concluído (2 fatias, gates verdes em cada) |
| 2026-10-22 | **B-9** `src/hooks/useOfflineSync.ts` 158→**63L** em 2 fatias: B-9a `use-offline-sync.queue` (enqueue/clearQueueForMatch/removeLastAction/getFailedCount como factory pura com identidade via useMemo) + remoção da entrada baseline (`45a77a9`, 158→89L, diff = só remoção); B-9b `use-offline-sync.network` (`attachNetworkListeners`: online/offline + flush inicial + intervalo 30s com cleanup; `0af336c`, 89→63L); gates por fatia: 3 suítes `useOfflineSync` (22 testes) + `useScoringPageState` (2 testes) + lint 0 erros | Concluído (2 fatias, gates verdes em cada) |
| 2026-10-22 | **B-10** `useScoringPageDerived.ts` 289→**81L** (3 fatias: B-10a `scoring-page-derived-flags` + `scoring-page-derived-edit-score` (`35fc7e0`, 289→187L); B-10b `scoring-page-display` (resolveDisplayState com normalização de set inicial + correção de server) + `useScoringPageDerived.types` + remoção da entrada baseline (`842d87c`, 187→95L, diff = só remoção); B-10c `scoring-page-active-players` (`3fccbfb`, 95→81L)) + `useScoringPageState.ts` 283→**99L** (2 fatias: B-10d characterization prévia R-15 (5 testes: shape de 71 chaves, gamePointToDisplay, syncStatus, refs de binding) + `useScoringPageState.types` (`a90cb7a`, 283→206L); B-10e `use-scoring-page-local-state` + `use-scoring-page-sync-status`, return vira composição `...local, ...sync` (`69440c5`, 206→99L) + entrada baseline removida (112→111, diff = só remoção)); gates por fatia: 6 suítes `useScoringPage` (23 testes) + gate amplo `scoring` 158 suítes (16 falhas = baseline) | Concluído (5 fatias, gates verdes em cada) |
| 2026-10-22 | **CHECKPOINT `test:strict` fim da faixa B**: **7 falhas / 335 suítes / 25 falhas em 3374 testes** = baseline exata (mesmas 7 suítes), zero regressão com todas as 43 fatias B commitadas | Concluído |
