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
| 4 | `core/scoring/edit-score-domain.ts` | 297/345 | **52** | ✅ **B-1 feito** — fatiado em 5 módulos `edit-score-*` (345→52L) |
| 5 | `matchService.ts` | 283 | **304** | Doubles-undo extraído; medição nova |
| 6 | `useScoringHandlers.point-processor.service.ts` | 272 | **289** | Envelope extraído; ainda >100 |
| 7 | `schemas/match.ts` | 272 | **298** | `ste-exception R-03` declarada (schema declarativo) |
| 8 | `useOfflineSync.ts` | 268 | **158** | Split #8 feito; ainda >100 |
| 9 | `DoublesServerSelectionModal.tsx` | 263 | **261** | Hook extraído; JSX quase não reduziu |
| 10 | `useScoringHandlers.serve-actions.service.ts` | 249 | **240** | Corte #10 feito; ainda >100 |

**Nenhum dos 10 chegou a ≤100L.** Exceções ativas: #2 e #7 (só 2 no projeto).

### 0.4 Top do backlog fora do top-10

`point/route.ts` (394), `rankingConstants.ts` (318), `engine.ts` (316), `matches/[id]/route.ts` (299), `use-edit-score-modal-submission.logic.ts` (290), `useScoringPageDerived.ts` (289), `useScoringPageState.ts` (283), `edit-score-state.ts` (281).

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
| **B-1** ✅ | `core/scoring/edit-score-domain.ts` | 345 → **52** | Dividir por responsabilidade (validação de resultado, limites de games, tiebreak, próximo sacador) → `core/scoring/edit-score-*` c/ re-exports | `editScoreHelpers.characterization` ✓ |
| **B-2** | `matchService.ts` | 304 → ≤100 | Nova(s) fatia(s) → `match-service-*.logic.ts` (padrão doubles 27L / create 104L / operations 234L) | `matchService.characterization` + `doubles-undo` ✓ |
| **B-3** | `point/route.ts` | 394 → ≤100 | Completar extração p/ `point/route.logic.ts` (já 267L) | verificar characterization da rota |
| **B-4** | `useScoringHandlers.ts` | 288 → ≤100 | Extrair wiring restante (effects/subscription/state bridge) | **Criar characterization mockada antes** (suíte main = baseline-failing; precedente `2dc5eec`) |
| **B-5** | `DoublesServerSelectionModal.tsx` | 261 → ≤100 | JSX em seções/children; estado já no hook | `DashboardMatchModals.doubles` ✓ |
| **B-6** | `point-processor.service.ts` | 289 → ≤100 | Próximos blocos puros → módulos | `point-processor.success-result.characterization` ✓ |
| **B-7** | `matchValidator.ts` | 191 → ≤100 | Dividir resto (progression) | `matchValidator.characterization` ✓ (87,87% stmts) |
| **B-8** | `serve-actions.service.ts` | 240 → ≤100 | Completar corte #10 | `serve-actions.characterization` ✓ |
| **B-9** | `useOfflineSync.ts` | 158 → ≤100 | Último bloco → módulo | suítes `useOfflineSync.*` ✓ |
| **B-10** | `useScoringPageDerived.ts` / `useScoringPageState.ts` (289/283) | → ≤100 | Promovidos ao top (cresceram) | `useScoringPageState.timeline.characterization` ✓ |

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
| 2026-10-22 | **B-1** `edit-score-domain.ts` 345→**52L** em 4 commits atômicos: `edit-score-domain.types.ts` (25L, b649838) → `edit-score-match-tiebreak.ts` (75L) + `edit-score-set-guards.ts` (62L) (ea1c531) → `edit-score-standard-set.ts` (87L) (e94ea2b) → `edit-score-next-server.ts` (93L) + fachada (30e9db3); API pública preservada via re-exports (44 consumidores intactos); baseline r03 removida com diff = só remoção | Concluído (4 fatias, gates verdes em cada) |
