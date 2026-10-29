# Plano R-03 — Top-10 da Fase 3/S3 e Backlog >100L

> **Data:** 2026-10-23 · **Status:** ✅ **CONCLUÍDO — META ALCANÇADA** (Faixas C/D/E/F 100%; baseline r03 **124 → 0**; restam 2 `ste-exception` justificadas)
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

### 0.5 Estado atual do Ratchet (2026-10-23, pós-Faixa F — CONCLUÍDO)

- **Baseline inicial (A-0/A-1):** 124 violações cruas (122 no baseline + 2 isentas via `ste-exception R-03`).
- **Baseline atual (`scripts/r03-baseline.json`):** **0 entradas** (+ 2 isentas: `schemas/match.ts` e `use-edit-score-calculator.ts`).
- **Progresso cumulativo:** **-122 arquivos** retirados do baseline com zero regressão funcional.
- **Distribuição restante:** **nenhum arquivo de produção >100L fora das 2 exceções declaradas** — meta R-03 atingida (≤5 `ste-exception` justificadas).

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

**Achado-chave:** 9 dos 13 "cresceram" + os 2 novos grandes regrediram no **commit de feature duplas `8479c4e` (2026-10-22)** — feature entregue no mesmo dia da auditoria, **antes** da guarda A-1. O ratchet agora impede repetição. ~~Lote **C-0 = os 16 `.tsx`** (prioridade máxima da Fase C)~~ → **✅ CONCLUÍDO (2026-10-22, 16/16)** — ver registro na §4.

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
- **Lote C-0 (prioritário):** os 16 `.tsx` regressados → ✅ **16/16 concluído** (18 commits, baseline 111→96).
- **Faixa C (≥250L):** 12 arquivos mapeados → ✅ **12/12 concluído** (31 commits, baseline 96→84). Checkpoint `test:strict`: 7 falhas / 336 suítes / 25 falhas em 3379 testes = baseline exata, zero regressão.
- **Faixa D (200–249L):** 19 arquivos mapeados → ✅ **19/19 concluído** (38 commits, baseline 84→65). Checkpoint `test:strict`: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão:
  - *Concluídos (15/19):* D-1 `useModalStack` (249→28L), D-2 `set-summary-stats` (248→78L), D-3 `score-normalizer` (247→64L), D-4 `edit-score-validation` (245→89L), D-5 `sessionService` (244→13L), D-6 `matchConfig` (240→60L), D-7 `useEditScoreModalSync` (235→45L), D-8 `match-service-operations.logic` (234→53L), D-9 `game-processing` (231→25L), D-10 `useScoringHandlers.match-fetch` (228→100L), D-11 `useVoiceRecorder` (217→82L), D-12 `use-edit-score-modal-input.logic` (216→51L), D-13 `rls-context` (213→59L), D-14 `useSessionManager.edit-score` (212→99L), D-15 `useScoringPageEffects` (211→93L).
  - *Fechamento (4/19):* D-16 `doubles.ts` (210→24L), D-17 `audio/route.ts` (209→62L), D-18 `useSessionManager.ts` (208→85L), D-19 `useSessionManager.state-builder.ts` (202→86L) — detalhes em §4.
- **Faixa E (150–199L):** 27 arquivos mapeados → ✅ **27/27 concluído** (28 commits, baseline 65→38). Checkpoint `test:strict`: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão — detalhes em §4.
- **Faixa F (101–149L):** 38 arquivos mapeados → ✅ **38/38 concluído** (40 commits, baseline 38→**0**). Checkpoint `test:strict`: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata, zero regressão — detalhes em §4.
- **Meta: ✅ ALCANÇADA** — 124 → **0** (com 2 `ste-exception` justificadas, abaixo do ideal ≤5).
- Recontagem oficial ao fim de cada faixa. ✅ Executada em todas.

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
| 16 `.tsx` regressados | ~~Lote C-0 prioritário logo após A~~ ✅ Concluído (16/16, baseline 111→96) |
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
| 2026-10-22 | **LOTE C-0 — os 16 `.tsx` regressados (16/16 ✅)**: `DoublesArrangementModal` 243→93 (types + `doubles-arrangement-side` + `use-doubles-arrangement`; `363c365`/`46537d5`); `ActionBar.sections` 190→2+fachada (`action-bar-serve-section` 91 + `action-bar-footer` 86 + re-exports; testes leitores de fonte dual-theme/telemetry re-apontados; `c78e69f`/`fb08574`); `PlayerSelection` 189→100 (characterization prévia 5 testes + `player-selection.types` + `match-type-toggle` + `doubles-player-pair` com excluded POR SLOT; `60dfd96`/`5c747bb`); `PlayerCard` 111→81 (`player-card-row`; `d3c6b0f`); `edit-match-info-sections` 115→53 (`section-shared` kernel sem ciclo + `extra-sections`; `c4dd9e7`); `timeline-point-row` 109→95 (`timeline-row-initials.logic`; `685c5af`); `ScoringModals` 109→64 (`scoring-point-modals`; `e126604`); `MatchTimelineView` 108→88 (types; `0e57560`); `DashboardMatchModals` 106→84 (types; `77a89df`); `MatchNewFormSections` 105→91 (`match-new-form-footer`; `e43b1fc`); `AthleteDropdown` 104→62 (`athlete-dropdown-panel` dono de colorClasses; `733dd83`); `ScoringPlayArea` 102→83 (`scoring-finished-banner` + telemetry-integrity #5 re-apontado; `8943513`); `EditAthleteModal` 102→91 (`edit-athlete-modal-footer`; `e2787f6`); `comment-modal-body` 102→78 (`comment-mode-tabs`; `5879230`); `point-details-breadcrumb` 108→52 (`breadcrumb-items.logic`; `87ef1fe`); **baseline r03 111→96** (15 remoções, diff = só remoções em todas); gates por fatia: typecheck + check:r03 + suítes afetadas (224 testes novos nas suítes dos alvos + characterization PlayerSelection) | Concluído (18 commits, gates verdes em cada) |
| 2026-10-22 | **CHECKPOINT `test:strict` pós-C-0**: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão com os 18 commits do C-0 + docs | Concluído |
| 2026-10-23 | **FAIXA C (≥250L) — 12/12 concluído (31 commits)**: `rankingConstants.ts` 318→**48L** (`701d0b4`…`ccbac34`) · `core/scoring/engine.ts` 316→**87L** (`1241a33`…`c27af22`) · `api/matches/[id]/route.ts` 299→**92L** (`0618c82`…`c5a3b01`) · `use-edit-score-modal-submission.logic.ts` 290→**93L** (`c7eead9`, `68254e0`) · `edit-score-state.ts` 281→**54L** (`5f1f8c2`, `abdf319`) · `live-tactical-insights.ts` 276→**48L** (`b10b9e5`, `ce63a52`) · `point/route.logic.ts` 267→**4L** (`f307f8a`, `d6cc53e`) · `report/route.ts` 265→**84L** (`56ea554`, `a423271`) · `useEditScoreModal.ts` 263→**91L** (`a1362bb`, `5b4209f`, `32836fe`) · `point-details-logic.ts` 257→**22L** (`e01ca3b`, `29d7362`) · `pressure-shot-stats.ts` 255→**52L** (`de376a9`, `0b78042`) · `useSuspendedSession.ts` 254→**86L** (`34c3c3e`, `ed9c773`, `a90cb8e`); **baseline r03 96→84** (12 remoções, diff = só remoção em todas); gates por fatia: typecheck + check:r03 + suítes do alvo | Concluído (31 commits `701d0b4`…`a90cb8e`) |
| 2026-10-23 | **CHECKPOINT `test:strict` fim da faixa C (12/12 arquivos)**: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão | Concluído |
| 2026-10-23 | **FAIXA D (200–249L) — progresso 15/19 alvos concluídos (34 commits)**: `useModalStack.ts` 249→**28L** (D-1a `modal-stack.types`+`modal-stack-url.logic` `5caa868`; D-1b `use-modal-stack-router`+`modal-stack-history.logic` `4579b63`; D-1c `use-modal-stack-internal-state`+`use-modal-stack-internal-actions` `d60938a` + fix lint `2fe9a5b`; baseline 84→83) · `set-summary-stats.ts` 248→**78L** (D-2a `set-summary-stats.types`+`set-summary-service.logic` `3686b0d`; D-2b `set-summary-errors.logic` `1769fd3`; baseline 83→82) · `score-normalizer.ts` 247→**64L** (D-3a `score-normalizer.types`+`score-normalizer-history.logic` `d5e46e0`; D-3b `score-normalizer-sets.logic`+`score-normalizer-legacy.logic` `00b0a9f`; baseline 82→81) · `edit-score-validation.ts` 245→**89L** (D-4a `edit-score-validation-tiebreak.logic` `df48449`; D-4b `edit-score-validation-set.logic` `333a6ce`; baseline 81→80; gate 12 suítes/188 testes) · `sessionService.ts` 244→**13L** (D-5a `session-service-queries.logic` `c96ef39`; D-5b `session-service-maintenance.logic`+`session-service-reactivate.logic` `551e84c`; baseline 80→79; gate 29 suítes/213 testes) · `matchConfig.ts` 240→**60L** (D-6a `match-config-types`+`match-config-formats.data` `45ba18c`; D-6b `match-config-tiebreak.logic` `a61875d`; baseline 79→78; gate 4 suítes/48 testes) · `useEditScoreModalSync.ts` 235→**45L** (D-7a `use-edit-score-modal-sync.types`+`use-edit-score-modal-sync.logic` `5d50bd3`; D-7b `use-edit-score-modal-sync-events`+`use-edit-score-modal-sync-storage` `e833538`; baseline 78→77) · `match-service-operations.logic.ts` 234→**53L** (D-8a `match-service-update-fields` `f164976`; D-8b `match-service-transition-doubles.logic` `8537906`; baseline 77→76) · `game-processing.ts` 231→**25L** (D-9a `game-set-transition` `054fce6`; D-9b `game-points` `cdee61c`; baseline 76→75) · `useScoringHandlers.match-fetch.ts` 228→**100L** (D-10a `useScoringHandlers.match-fetch.types`+`match-fetch-replay.logic` `1d2a57b`; D-10b `match-fetch-restore.logic`+`match-fetch-badges.logic` `79f8e10`; baseline 75→74) · `useVoiceRecorder.ts` 217→**82L** (D-11a `voice-recorder.types`+`voice-recorder-support.logic` `96d70b7`; D-11b `use-voice-recorder-lifecycle` `267e7d8`; D-11c `use-voice-recorder-capture-start` `2121a55`; D-11d `use-voice-recorder-capture-stop`+`use-voice-recorder-preview` `5a22462`; baseline 74→73) · `use-edit-score-modal-input.logic.ts` 216→**51L** (D-12a `edit-score-modal-input-values.logic`+`edit-score-modal-set-build.logic` `9362b51`; D-12b `edit-score-modal-set-actions.logic` `943e2eb`; baseline 73→72) · `rls-context.ts` 213→**59L** (D-13a `rls-storage.logic`+`rls-context-run.logic` `d451d02`; D-13b `rls-context-middleware.logic` `4e7de8e`; baseline 72→71) · `useSessionManager.edit-score.ts` 212→**99L** (D-14a `useSessionManager.edit-score.types`+`edit-score-suspended.logic` `41f6ec7`; D-14b `edit-score-persist.logic` `3f01b2b`; baseline 71→70) · `useScoringPageEffects.ts` 211→**93L** (D-15a `useScoringPageHandlers.types`+`useScoringPageHandlersBridge` `2275677`; D-15b `useScoringPageSessionBridge` `0c6db08`; baseline 70→69); **baseline r03 84→69** (15 remoções, diff = só remoções em todas); gates por fatia: typecheck + check:r03 + suítes dos alvos; baseline r03 84→69 (15 remoções, diff = só remoções em todas); gates por fatia: typecheck + check:r03 + suítes dos alvos | Concluído (34 commits) |
| 2026-10-23 | **FAIXA D (200–249L) — fechamento 19/19 (4 commits)**: D-16 `doubles.ts` 210→**24L** (fachada reexportando `doubles-members` 65L + `doubles-serving` 87L + `doubles-arrangement` 55L novo; gate 3 suítes duplas/19 testes; `ecc1711`; baseline 69→68) · D-17 `point/[pointId]/audio/route.ts` 209→**62L** (`audio-handlers` 73L + `audio-validation` 90L + `audio-storage` 38L novos; ordem content-type→formData preservada; gate 3 suítes/12 testes; `40e8130`; baseline 68→67) · D-18 `useSessionManager.ts` 208→**85L** (`useSessionManager.types` 52L + `useSessionManager.lifecycle` 80L: beforeunload/pagehide + renovação deslizante, `matchVersionRef` interno; gate 15 suítes/134 testes incl. scoring.page.characterization; `fbd4cd2`; baseline 67→66) · D-19 `useSessionManager.state-builder.ts` 202→**86L** (`state-builder.sets` 68L: buildNextEmptySet+isLastSetEditFinalized, `state-builder.game` 57L: buildCurrentGame; gate 6 suítes/68 testes; `2bdabe5`; baseline 66→65); **baseline r03 69→65** (4 remoções, diff = só remoções em todas); gates por fatia: typecheck + check:r03 + suítes dos alvos | Concluído (4 commits `ecc1711`…`2bdabe5`) |
| 2026-10-23 | **CHECKPOINT `test:strict` fim da Faixa D (19/19 arquivos)**: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão; **0 arquivos ≥200L restantes** — próxima Faixa E (150–199L, 27 arquivos) | Concluído |
| 2026-10-23 | **FAIXA E (150–199L) — 27/27 concluído (28 commits)**: E-1 `timeline-format` 199→6L (`3c18254`) · E-2 `rankingLogic` 197→25L (`5ee3fe2`) · E-3 `use-session-manager.logic` 197→4L (`8e36704`+`b99d998`: validate 129L→split validate+sets-won) · E-4 `momentum-set-stats` 196→2L (`4ba6a3c`) · E-5 `serve-return-stats` 193→3L (`089f9e1`) · E-6 `use-edit-score-modal-confirm.logic` 189→15L (`57f6f6a`) · E-7 `core/scoring/types` 186→20L (`d3fd1f8`; gate amplo scoring 3 falhas/16 testes = ref) · E-8 `useScoringHandlers.point-sync` 184→86L (`581671f`) · E-9 `comments/[commentId]/audio/route` 181→17L (`8fe5fb0`) · E-10 `annotationSessionService` 181→53L (`51c746a`) · E-11 `timeline-set-results` 179→15L (`8b2eca7`) · E-12 `state/route` 172→11L (`0e8b181`) · E-13 `core/scoring/tiebreak` 170→6L (`8faf845`) · E-14 `timeline-rebuild` 170→75L (`aa247ff`) · E-15 `use-edit-score-modal-validation` 169→7L (`3910c97`) · E-16 `undo-redo.service` 164→65L (`05ad486`) · E-17 `dashboard.resume` 163→68L (`0cebbce`) · E-18 `point-log-merge` 161→3L (`f2d379d`) · E-19 `useDashboardMatches` 159→72L (`8b6303b`) · E-20 `point-context` 159→3L (`143f047`) · E-21 `arrangement/route` 158→81L (`59d8d1b`) · E-22 `match-card.logic` 156→21L (`fac090e`) · E-23 `lib/auth` 156→17L (`5019e80`; characterization prévia 5 suítes/49 testes) · E-24 `useScoringComment` 154→71L (`0c55f78`) · E-25 `point/[pointId]/route` 151→14L (`3daea27`) · E-26 `set-completion` 151→7L (`b5e6526`) · E-27 `useScoringHandlers.persistence` 151→83L (`e0e0829`); **baseline r03 65→38** (27 remoções, diff = só remoções em todas); gates por fatia: typecheck + check:r03 + suítes dos alvos | Concluído (28 commits `3c18254`…`e0e0829`) |
| 2026-10-23 | **CHECKPOINT `test:strict` fim da Faixa E (27/27 arquivos)**: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão; **0 arquivos ≥150L restantes** (máx. atual 149L) — próxima Faixa F (101–149L, 38 arquivos) | Concluído |
| 2026-10-23 | **FAIXA F (101–149L) — 38/38 concluído (40 commits)**: F-1 `useScoringTimelineSync` 149→75L (`2ef8b7e`) · F-2 `use-point-details-modal` 148→84L (`783bcaa`) · F-3 `comments/route` 147→13L (`938fcdb`) · F-4 `useNewMatchSubmissionActions` 146→79L (`0dd4119`) · F-5 `edit-score-state.types` 141→14L (`e0f1eac`) · F-6 `schemas/rally` 140→3L (`6e49996`) · F-7 `adminService` 139→31L (`dde8f79`) · F-8 `match-tiebreak` 138→2L (`c726d66`) · F-9 `matchesClient` 137→19L (`7d6f5bb`) · F-10 `comments/[commentId]/route` 136→13L (`d11689a`) · F-11 `players/[id]/route` 136→31L (`d18c606`) · F-12 `useOfflineMatchSync` 135→45L (`5683b25`) · F-13 `test-helpers/auth` 135→28L (`ddb3d84`) · F-14 `useScoringLifecycleEffects` 134→68L (`ee2ea02`) · F-15 `lib/logger` 134→45L (`6e919b9`) · F-16 `auth-client` 129→12L (`e138d95`) · F-17 `useScoreboardUIState` 128→48L (`262cd5a`) · F-18 `matches/route` 127→13L (`2ec4e4e`) · F-19 `useCommentOfflineSync` 126→40L (`ecf5be4`+`47d30aa`: queue 108L→split queue+flush) · F-20 `useSessionManager.abandon` 126→37L (`c4b373e`) · F-21 `lib/errors` 124→15L (`b94e05a`) · F-22 `middleware` 122→55L (`a1df5cb`) · F-23 `scoring-domain` 121→9L (`3710006`) · F-24 `use-point-details-scroll.logic` 119→3L (`7f472a2`) · F-25 `core/report/types` 119→15L (`b31e701`) · F-26 `useScoringHandlers.types` 119→3L (`cc395c3`) · F-27 `matchRepository` 118→44L (`e2ea66f`) · F-28 `sessions/route` 117→35L (`d1a64ab`) · F-29 `use-scoring-page-chrome` 115→74L (`66972bf`) · F-30 `usePointDetailsScroll` 111→82L (`f573569`) · F-31 `dashboard.actions` 110→2L (`993316a`) · F-32 `edit-score-modal.types` 107→2L (`cbd16f7`) · F-33 `game-errors` 107→68L (`94f8cb5`) · F-34 `playerService` 107→9L (`f8fb21d`) · F-35 `use-offline-sync.logic` 105→12L (`99ec3c2`) · F-36 `api.logic` 105→9L (`8f3b2a6`) · F-37 `match-service-create.logic` 104→4L (`7dbb20e`) · F-38 `shadow-replay` 102→58L (`0d455c3`); **baseline r03 38→0** (38 remoções, diff = só remoções); gates por fatia: typecheck + check:r03 + suítes dos alvos | Concluído (40 commits `2ef8b7e`…`0d455c3`) |
| 2026-10-23 | **CHECKPOINT `test:strict` fim da Faixa F + PLANO R-03 CONCLUÍDO**: **7 falhas / 336 suítes / 25 falhas em 3379 testes** = baseline exata (mesmas 7 suítes), zero regressão; **baseline r03 = 0 entradas** + 2 `ste-exception` (`schemas/match.ts` 298L declarativo, `use-edit-score-calculator.ts` 150L wiring React) — **meta 124→0 alcançada**, abaixo do ideal ≤5 exceções; 106 arquivos totais fatiados em Fases A–F (68 commits Faixas C+D+28 E+40 F + Fases A/B) | Concluído |

