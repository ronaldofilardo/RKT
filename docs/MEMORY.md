# MEMORY — RKT (Racket App)

> Diário de bordo técnico · Metodologia RE-DOC (Fase 4 — Auditoria de Qualidade e Histórico)
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.

**Última Atualização:** 2026-10-20
**Analisado por:** engenharia reversa e implementação sobre `main`

---

## 1. Estado Atual do Projeto

| Dimensão | Situação |
|---|---|
| Branch | `main` |
| Working tree | Limpo (após docs commit) |
| Foco atual | **Refatoração STE-DEV — `docs/PLANO_REFATORACAO_STEDEV.md`**: FASE 3 100% CONCLUÍDA — R-01 (glossário) ✓ · R-03 (backlog 53→0 `.tsx` >100L) ✓ · R-02 (nomenclatura proibida: 0 violações) ✓ · R-23 (P1/P3 save/create/submit e hooks) ✓ · R-12 (tokens e cores semânticas: 0 hexadecimais soltos) ✓ · R-13 (acessibilidade ARIA em modais/tabs/alerts) ✓ |
| Docs de processo | `AGENTS.md` (índice) + estritamente os 6 arquivos-canônicos em `docs/` |

---

## 2. Últimos Commits (linha do tempo recente)

| 2026-10-22 | `HEAD` | **Scoring (Correção de Set Fantasma 0-0 no Placar Dinâmico)** — Correção em `src/core/scoring/game-processing.ts` (`onGameWon`): remoção da checagem legada `currentSet.player1 === 0 && currentSet.player2 === 0`, que empilhava indevidamente um novo set via `.push()` quando o set inicial já existia no array `state.sets` (como no caso pós-edição de placar ou inicialização antecipada), fazendo o 1º set ficar congelado em 0-0 e o jogo em andamento ser exibido no Set 2. A condição foi unificada para usar estritamente `isNewSet` provido por `resolveActiveSet`. Adição de teste unitário de regressão e saneamento da partida no banco de dados local (`cmvj3l0bu0002bfe4c7mbud9w`). DoD: `typecheck` ✓ (0 erros) · 46/46 suites core/scoring (614/614) ✓. |
| 2026-10-22 | `HEAD` | **Suporte Completo a Duplas (Fases A a H — PLANO_DUPLAS_2026-10-21)** — Implementação end-to-end com 100% de retrocompatibilidade com simples: (i) Fase A: gravação defensiva e validação atômica; (ii) Fase B: núcleo puro de regras ITF de duplas em `src/core/scoring/doubles.ts` (ordem de saque A1→B1→A2→B2, tiebreak A1(1)→B1(2)→A2(2)→B2(2), lados fixos de devolução no set, deuce no-ad com escolha do devolvedor pela dupla receptora, ajuste de formação entre sets); (iii) Fase C: persistência Prisma com `matchType`, `player1PartnerId`, `player2PartnerId`, `doublesSetup`, migrations e rotas `/point`, `/arrangement`, `/state`, `/report`; (iv) Fase D: tela de nova partida com seleção de 4 atletas distintos e modal de formação inicial; (v) Fase E: UI de `/scoring` com indicador luminoso de sacador ativo, badge de devolvador ativo, `PointDetailsModal` com seleção de quem bateu e escolha de lado de devolução no deuce no-ad, e `DoublesArrangementModal` entre sets; (vi) Fase F: modal Editar Placar preservando rotação e estado de duplas; (vii) Fase G: timeline e relatório exibindo nomes e estatísticas de duplas, iniciais de sacador e time (`RF/ND`), e cards do dashboard; (viii) Fase H: 100% dos testes estritos passando (0 skips, 0 only, 613/613 core tests, 40/40 doubles tests, 234/234 UI tests, `tsc --noEmit` 0 erros). |
| 2026-10-20 | `HEAD` | **Report (Header fixo com rolagem inferior)** — Fixação do cabeçalho da tela de relatório (`ReportHeader` em `report-view-header.tsx`) com `sticky top-0 z-30 bg-telemetry-card/95 backdrop-blur-md border-b border-white/10 shadow-md`, permitindo que as abas (`TabBar`), estatísticas e a tabela de pontos da `Timeline` rolem suavemente por baixo do cabeçalho de identificação e metadados da partida. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `ReportPage.view.test.tsx` 3/3 ✓. |
| 2026-10-20 | `HEAD` | **Scoring (Detalhes do Ponto: Duração 1-4/5-8/+9 e despoluição visual)** — (i) Atualização dos intervalos de duração do rali no modal `PointDetailsModal` (`DURACAO_OPTIONS` em `point-details-logic.ts`) de `3 a 6`, `7 a 10`, `Mais de 11` para `1-4 bolas`, `5-8 bolas` e `+9 bolas`, unificando a entrada de dados com os padrões da ATP/ITF e o cálculo estatístico de ralis (`pressure-shot-stats.ts: short <= 4, medium 5-8, long >= 9`); atualização de `duracaoLabel`, `trocasFaixaLabel` em `timeline-format.ts` e legenda em `timeline-legend.tsx`; (ii) remoção do componente `PointDetailsBreadcrumb` e scroll handler em `PointDetailsModal.tsx`, eliminando duplicação visual e barra de rolagem horizontal desnecessária abaixo do `WinnerInfo`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `point-details-logic.test.ts` 43/43 ✓ · `timeline-utils.trocas-faixa.test.ts` 4/4 ✓ · `SectionRenderer.test.tsx` 28/28 ✓ · `PointDetailsModal.characterization.test.tsx` 60/60 ✓ · `PointDetailsModal.test.tsx` 4/4 ✓. |
| 2026-10-20 | `0961f7b` | **Scoring (Indicador de Saque em Match Tie Break)** — Correção do indicador de sacador (`p1IsServing` / `p2IsServing` e `effectiveScoreState.server`) no hook `useScoringPageDerived`: remoção da sobrescrita cega quando `totalGames === 0`, restringindo a imposição do `initialServerId` estritamente a estados virgens (`isVirginState`: sem games completados, sem pontos no game atual e sem pontos no tiebreak). Garante que a alternância ponto a ponto calculada pelo `ScoringEngine` em `MATCH_TB_10` seja refletida visualmente em tempo real nos cards de jogador e no placar. DoD: `typecheck` ✓ (0 erros) · teste de regressão `useScoringPageDerived.server-tiebreak.regression.test.ts` 3/3 ✓ · suites derivadas 6/6 ✓ · engine serverId 6/6 ✓. |
| 2026-10-18 | `HEAD` | **Alinhamento Stitch (Court Precision Tech)** — Implementação das melhorias ergonômicas e gaps identificados via StitchMCP: (i) tokens e utilitários de elevação luminosa `shadow-telemetry-volt` e `shadow-telemetry-blue` no Tailwind e CSS variables para Dark/Light; (ii) padronização de touch targets na `ActionBar` para `min-h-[48px]` com espaçamento estrito de 8px; (iii) isolamento físico do botão `↩ Voltar` no flanco esquerdo com controles secundários agrupados à direita; (iv) novo componente de navegação ágil `PointDetailsBreadcrumb` no topo do modal de detalhes com salto direto por seção; (v) saneamento de resíduos de classes genéricas `gray-*`/`blue-*` em `pills-component.tsx` e `SectionRenderer.tsx`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `PointDetailsBreadcrumb.test.tsx` 3/3 ✓ · `ActionBar.characterization.test.tsx` 11/11 ✓ · `PointDetailsModal.test.tsx` 64/64 ✓. |
| 2026-10-17 | `767bbad` | **Consistência Editar Placar, ACE/DF, Timestamp e Reidratação (Fases 0 a 5)** — (i) Fase 1: correção de `ScoringEngine.fromSerialized` para não forçar `initialServerId` indevidamente em `MATCH_TB_10` ou placares com pontos/jogos iniciados; modo sombra defensivo em `POST /point` (`logger.warn`) para divergência de sacador; script de auditoria `scripts/audit-server-id.ts` (37 partidas recuperadas/auditadas); (ii) Fase 2: reidratação pós-F5 do engine via replay de `PointLog` desde a última `MatchScoreEdit` (D4), habilitando botão "Voltar" (Undo) até a fronteira da edição; persistência de `pointLogSequenceAtEdit` em `MatchScoreEdit.newScoreState`; manutenção da sessão de anotação ativa após edição de placar em andamento (D6); (iii) Fase 3: contadores estatísticos separados: ACE não conta como winner de rally (D1), DOUBLE_FAULT não conta como UFE de golpe de rally e entra como erro do sacador nos erros totais do set (D2); (iv) Fase 4: validação e persistência do timestamp do cliente com proteção contra clock drift futuro e clamp seguro no início da partida (D3); (v) Fase 5: remoção de `isLet` de schemas, contratos e engine. DoD: typecheck ✓ (0 erros) · 8/8 suites engine (196/196) ✓ · suítes de teste de cada fase passando ✓. |
| 2026-10-16 | `HEAD` | **R-13 (Acessibilidade A11y)** — inclusão de `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `role="alert"` em mensagens de erro e semântica de tabs (`role="tablist"`, `role="tab"`, `aria-selected`) em todos os modais extraídos e formulários (`PointDetailsCloseDialog`, `PointDetailsModal`, `PointDetailsNotesModal`, `ServerEffectModal`, `comment-modal-body`, `server-effect-modal-close-dialog`, `NewAthleteModal`, `EditAthleteModal`, `schedule-confirm-modal`, `ConfirmDeleteMatchDialog`, `login/page.tsx`, `point-details-notes-fields.tsx`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · test:strict 296/296 (3200/3200) ✓ · lint 0. |
| 2026-10-16 | `623ae2f` | **R-12 (Tokens e Cores Semânticas)** — tokens de telemetria para superfícies de quadra (`clay`, `grass`, `hard`) em `globals.css` e `tailwind.config.ts`, e eliminação de 28 hexadecimais soltos e 14 rgba soltos em componentes de produção (`PointDetailsCloseDialog`, `CommentModal`, `comment-modal-body`, `comment-modal-views`, `PointDetailsModal`, `ServerEffectModal`, `ModalActions`, `WinnerInfo`, `CourtBackground`, `AnnotationSessionPanel`, `game-errors-histogram-slot`, `GameErrorsHistogram`, `match-card-score-table`, `match-card-player-row`, `use-match-card-data`, `matchConstants`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · lint 0 · testes de dashboard e scoring 10/10 (130/130) ✓. |
| 2026-10-16 | `1210a07` | **R-02/R-23 (P3)** — eliminação de resíduos Handler/Helpers em hooks e services de scoring: `useScoringCommentHandler.ts` → `useScoringComment.ts` (função `useScoringComment`), `useScoringEditScoreHandlers.ts` → `useScoringEditScore.ts` (função `useScoringEditScore`), `createServerResolutionService` e `createScoringModalsService` canônicos com aliases mantidos; DoD: typecheck ✓ · test:strict 296/296 ✓ · test:design 3/3 ✓ · lint 0. |
| 2026-10-16 | `d92f763` | **R-23 (P1)** — cluster save/create/submit e duplicações: desambiguação de `getGameProgress` (`getGamePointCount` em `matchValidator` vs `getGameProgressRatio` em `player-card.logic`), padronização de `submitFormPayload` (`submitLoginForm`, `submitMatchInfoForm`, `submitNewAthleteForm`, `submitNewMatchForm`), padronização de `persistFormChanges` (`saveAthleteChanges`, `saveEditedAthlete`, `saveComment`, `savePointNotes`), correção de `confirmMatchDeletion` → `confirmAthleteDeletion`, e contextualização de `confirmCurrentAction` (`confirmServerEffect`, `confirmPointDetails`, `confirmScheduleModal`); DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0. |
| 2026-10-16 | *WIP* | **Scoring / Timeline (Áudio)** — Correção vertical do áudio nas observações da Timeline: (i) desacoplamento de pareamento por índice em `enrichTimelineWithAudio` via busca imutável por `pointId` e contagem de pontos reais ignorando `segmentBreak`; (ii) unificação da ordenação em `point-logs-meta` (`sequenceNumber`, `timestamp`, `id`) alinhada com a rota `report`; (iii) seleção de `audioNoteMime` e inferência resiliente de `hasAudioNote` para gravações com duração curta; (iv) revalidação imediata em tempo real pós-upload (`onAudioUploaded`) invocando `fetchTimelinePoints()` e `setEngineTick()`; (v) validação estrita de `res.ok` em `uploadAudioNote`. DoD: typecheck ✓ · test:strict 298/298 (3205/3205) ✓ · test:design 3/3 (26/26) ✓ · lint 0 ✓. |
| 2026-10-16 | `cc63c4b` | **Login (cosmético)** — unificar redirects de logout/401 com `redirectToLogin()`. |
| 2026-10-16 | `04e069e` | **R-02 (A/B/C)** — nomenclatura proibida: 39 arquivos `*helpers*`/`*utils*` → `*logic*`/`*domain*` (`8c2f809`), 11 funções `process*` → `apply*` (`c4deacf`), 98 funções `handle*` → verbos canônicos (`b8d1b4e`) — 3 commits + remoção de mapa temporário; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; **produção: 0 violações R-02**. |
| 2026-10-16 | `af705d5` | **UI-32..UI-44** (rodada R-03 final): `SectionRenderer.tsx` 156→69, `NewAthleteModal.tsx` 155→83 (hook), `DateTimeSection.tsx` 154→60 (hook+input+modal), `ConfirmAlertDialog.tsx` 134→90 (logic+content), `SportFormatSection.tsx` 128→33 (3 subcampos), `login/page.tsx` 124→39 (hook+fields), `AudioNotePlayer.tsx` 123→39 (hook+logic), `match/new/page.tsx` 121→40 (form sections), `LiveCountersBar.tsx` 121→74 (guardião telemetry), `timeline-filters.tsx` 110→74 (Chip), `ThemeContext.tsx` 103→36 (hook), `match-card-components.tsx` 102→3 (barrel), `TournamentSection.tsx` 101→82 (autocomplete) — 13 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **13 → 0** (R-03 ✓). |
| 2026-10-16 | `90db474` | **UI-27..UI-31** (rodada R-03): `PointDetailsModal.tsx` 176→86 (hooks), `RankingForm.tsx` 175→32 (card+fields), `ScoringPlayArea.tsx` 169→98 (guardião telemetry), `PlayerCard.tsx` 159→56 (types/logic/touch), `AthleteListTable.tsx` 157→44 (row/empty/helpers) — 5 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **18 → 13**. |
| 2026-10-16 | `8329e9e` | **UI-21..UI-26** (rodada R-03): `ScoringModals.tsx` 203→91, `PointDetailsNotesModal.tsx` 201→84, `atletas/page.tsx` 197→82 (hook `useAtletasPage`), `ReportPage.view.tsx` 186→39, `GameErrorsHistogram.tsx` 184→68, `MatchDetailsSection.tsx` 178→90 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **24 → 18**. |
| 2026-10-15 | `0f7ec5a` | **UI-16..UI-20** (rodada R-03): `NewAthleteModalForm.tsx` 235→60, `ServerEffectModal.tsx` 235→95, `edit-score-summary.tsx` 216→92 (barrel), `EditAthleteModal.tsx` 215→97 (hook + submissão pura), `locate/page.tsx` 206→72 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **29 → 24**. |
| 2026-10-15 | `edfd783` | **UI-12..UI-15** (rodada R-03): `ScoreboardCard.tsx` 250→72, `admin/page.tsx` 249→77, `DashboardViewRouter.tsx` 241→98, `SessionContext.tsx` 238→98 — tipos (`*-types.ts`), lógica pura (`*-logic.ts`/`*.reducer.ts`), hooks (`use-*.ts`) e seções (kebab-case) em módulos ≤100L; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **33 → 29**. |
| 2026-10-15 | `a9ed92f` | **UI-10/UI-11**: `CommentModal.tsx` 293→47 (view/gravador/hook + body) e `EditScoreModal.tsx` 261→65 (tipos, shell, conteúdo com `EditScoreSetInputSection`, hook `use-edit-score-modal-view`) — 8 commits, ambos R-03 ✓. |
| 2026-10-15 | `7ad8963` | **UI-9** `edit-score-form.tsx` 320 → 60 linhas: casca fina (`SetInputFormProps` + ref de foco) sobre `edit-score-form-body`/`-trail`/`-header`/`-feedback`/`-actions`/`-games-grid`/`-game-column` em 8 arquivos ≤100L. |
| 2026-10-15 | `3f257a2` | **UI-8** `AdvancedStats.tsx` 316 → 23 linhas: primitivas (`StatRow`, `Section`, `PlayerColumnHeader` deduplicando cabeçalho repetido em 4 seções), seções básicas (serve/return/pressure), `ShotSection` (com `ByStrokeGrid` deduplicando blocos idênticos), `MomentumSection` e `SetBreakdownSection` em 6 arquivos ≤100L. |
| 2026-10-15 | `c102365` | **UI-7** `SetSummaryModal.tsx` 327 → 91 linhas: `StatBarBilateral`, seções de estatísticas, cabeçalho/abas, card de placar, rodapé de ações e hook `useSetSummaryReport` (7 arquivos ≤100L). |
| 2026-10-15 | `93a6cda` | **UI-6** `dashboard/page.tsx` 337 → 69 linhas: `useDashboardPageModel` (auth/dados/modais/filtros + `resolveDashboardView`), `useDashboardMatchActions`, `useDashboardSetSummary`, `useDashboardServerStart`, `DashboardChrome` (topo/menu/logout), `DashboardMatchModals` + `ConfirmDeleteMatchDialog` (8 arquivos ≤100L). |
| 2026-10-15 | `a66caf2` | **UI-5** `scoring/page.tsx` 339 → 94 linhas: `scoring-page-screens`, `useScoringPageChrome` (tipos `ScoringPageState/Effects/Derived`), `scoring-page-play-area`, `scoring-page-controls` e `scoring-page-layout` (6 arquivos ≤100L). |
| 2026-10-14/15 | `a30b850` `172ac42` `12dfae9` `9f5b9fe` | **UI-1..UI-4 + R-01**: `MatchTimelineView.tsx` 535→96, `MatchCard.tsx` 409→86, `EditMatchInfoModal.tsx` 370→97, `timeline-rows.tsx` 342→81; `docs/glossario.md` recriado em UTF-8 limpo (147 linhas). |
| 2026-10-14 | `d05bc60` | **Fase 4** remoção de scratch files órfãos da raiz. |
| 2026-10-13 | *WIP* | Atletas (`RankingForm`, `NewAthleteModal`, `EditAthleteModal`): refatoração da disposição visual dos campos em 'Novo Atleta' e 'Editar Atleta', com layout fixo (flex-nowrap, shrink-0) onde o checkbox do ranking fica no topo à esquerda com o botão 'Remover' logo abaixo, e as colunas de Categoria, Classe, Posição e 'Posição Ranking Juvenil' têm seus rótulos alinhados horizontalmente com o checkbox na linha 1 e seus selects/inputs alinhados com o botão 'Remover' na linha 2, garantindo que todos os campos fiquem na mesma linha horizontal sem quebras. |
| 2026-10-13 | *WIP* | Dashboard MatchCard UI: remoção do prefixo 'Modo de jogo: ' no componente `FormatLabel`, mantendo o alinhamento estrito à direita (`ml-auto shrink-0 justify-end`) para que todas as ações e informações do cabeçalho caibam em uma única linha. |
| 2026-10-13 | *WIP* | Scoring (/scoring): (i) início do cronômetro interno da partida (`startedAt`) estritamente ao marcar o 1º ponto em nova partida via `ScoringEngine.applyPoint`, rota `POST /point` e `useScoringLifecycleEffects` com `setInterval`; (ii) no placar dinâmico (`ScoreboardCard`), títulos de colunas adaptados a cada formato do sistema (`Set 1`, `Set 2`, `TB` para formatos com super tiebreak; `TB` único para `MATCH_TB_10`; `Set 1..5` para `BEST_OF_5`), com ênfase visual na coluna do set em andamento; (iii) no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`), projeção visual de `2 a 2` em ambos os sets desde a criação. |
| 2026-10-13 | *WIP* | Dashboard MatchCard & Modal Editar Info: (i) projeção de 2-2 em ambos os sets no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`) desde a criação da partida no card; (ii) novo botão `⚙️ Info` no cabeçalho do `MatchCard` para partidas não finalizadas (`state !== 'FINISHED'`), abrindo o modal `EditMatchInfoModal`; (iii) inclusão e persistência do campo "Clube" (`clubName`) no Prisma, migration DDL, services, repository, modal de edição e relatório; (iv) correção do erro 405 (Method Not Allowed) em `/api/matches/[id]` ao exportar o método `PATCH = PUT`. |
| 2026-10-13 | *WIP* | Formulário 'Nova Partida' & Timeline Report: (i) campo horário opcional com correção definitiva de contraste/opacidade nos seletores de data e hora (modo claro e escuro, sem background branco indesejado e com ícones nativos invertidos/contrastados e showPicker no clique); (ii) criação direta ao dashboard sem modal de sacador; (iii) novo campo livre `details` persistido em `Match.details` (Prisma/DDL); (iv) exibição em 3 linhas estruturadas (linha 1: título, linha 2: rótulo/ex: Torneio, linha 3: valor/ex: Open) acima de 'Comentários' em `/report > timeline`. |
| 2026-10-13 | *WIP* | Correção do cálculo de "Resultado" ao final da timeline em `/report`: cálculo correto dos games no último ponto do set e propagação de `scoreState`. |
| 2026-10-08 | *WIP* | Desacoplamento de `history` de `Match.scoreState` no caminho quente do `POST /point` (eliminação do custo quadrático O(N^2)). Blindagem atômica do Undo (`voidLastPoint`/`isUndo`) sincronizando `PointLog`, backfill de tiebreaks legados, engine de Shadow Mode e reidratação de badges via `recentWinnerIds`. |
| 2026-10-08 | *WIP* | Correção do TD-003 (perda de contexto RLS com getRLSUser) via injeção de dependência no withRLSHandler. Adição de renovação deslizante de sessão e correção do middleware (token nulo). |
| 2026-10-05 | *WIP* | Correção do modal Editar Placar: regra de piso de abandono, alternância ITF de tiebreak, Deuce/Adv, auditoria de notas e blindagem Prisma |
| 2026-10-01 | `c53ae98` | Guardrails do Telemetry, toggle binário light/dark, saneamento de código morto legado |
| 2026-09-30 | `30ec07d` | Dual-theme, ações no header de card do dashboard, opacidade de fonte |
| 2026-09-30 | `77890d0` | Conflito de offline sync e fronteiras de papel (role boundary) |
| 2026-09-30 | `08257ec` | Timeline de scoring, editar placar e insights táticos |
| 2026-09-28 | `62ea451` | `PointDetailsModal`, `SectionRenderer`, `usePointDetailsScroll` |
| 2026-09-28 | `7b73a7c` | Ignorar artefatos de scratch/test-results |
| 2026-09-28 | `b30e906` | Redesign de UI em atletas, dashboard, criação de partida e scoring |
| 2026-09-28 | `e2e16b7` | Redesign de componentes + fluxos de ranking/atletas |
| 2026-09-26 | `fb4fb5f` | Bugs críticos de histórico e timeline |
| 2026-09-26 | `b1e2106` | Timezone de data e lógica de UI de ranking |

**Padrão observado:** ciclos curtos de `feat` → `fix` → `refactor` → `test(characterization)` no mesmo domínio (scoring/dashboard), com saneamento de legado no fim de cada ciclo.

---

## 3. Marcos do Projeto (histórico consolidado)

| Período | Marcos |
|---|---|
| 2026-06 | Migração inicial do domínio (users/players/matches/point logs) |
| 2026-07 | Adoção multi-agente (ADR-0001), Onda 0 Discovery, refatoração de hooks/pages, elevação de segurança (ADR-0005) |
| 2026-08 | Remoção da PWA, strategy de formatos (ADR-0003), repository pattern (ADR-0004), migrações de áudio e edição de placar |
| 2026-09 | Onda pesada de scoring: undo, idempotência, sessões, timeline, comentários/áudio, offline sync, relatório, RBAC resolvido (TD-051..055), limpeza de código morto |
| 2026-09 fim | Redesign de UI + dual theme |
| 2026-10-01 | Guardrails do Telemetry Design System |

---

## 4. Saúde Técnica
 
| Verificação | Estado |
|---|---|
| `pnpm typecheck` | ✅ **Executado em 2026-10-15 — sem erros** |
| `pnpm lint` | ✅ **Executado em 2026-10-15 — 0 erros / 0 warnings** |
| `pnpm test:design` | ✅ **Executado em 2026-10-15 — 3 suites / 26 testes passando** |
| `pnpm test:strict` | ✅ **Executado em 2026-10-15 — 291/294 suites e 3191/3196 testes passando**; 3 falhas = baseline pré-existente (`dashboard.hooks.guards`, `match-authorization.baseline`, `useOfflineSync.real`) |
| `pnpm test` / coverage | ✅ **Executado em 2026-10-05 — 277 suites / 3056 testes passando (100%)** |
| CI (`quality.yml`) | ✅ Configurado: typecheck → no-skipped-tests → test:strict → coverage (Postgres 16) |
| Mutation testing | ⚠️ Configurado (≥80% high) mas **fora do CI** (TD-015) |
| E2E | 6 specs (ciclo completo, sessão, offline ×2, undo, conflito) + a11y |

---

## 5. Dívidas e Riscos Vigentes (top 8)

| ID | Tema | Severidade | Situação |
|---|---|---|---|
| TD-003 | Propagação de RLS (`setRLSUser`) | Resolvida | Corrigido via injeção direta de `user` nos handlers, evitando falha de `AsyncLocalStorage`. |
| TD-008/060 | Segredos/centralização JWT (`src/lib/jwt.ts` nunca entregue) | Crítica | Texto revisado 2026-09-30: sem literal hardcoded |
| TD-001 | Sem testes de integração com banco real | Alta | Mitigação parcial via CI |
| TD-002 | Validação Zod incompleta nas APIs | Alta | ~8 endpoints pendentes |
| TD-009 | Sem rate limiting | Alta | Aberto |
| TD-015 | Mutation testing fora do CI | Média | Config pronto |
| TD-057 | `NEXT_PUBLIC_COMMENT_FEATURE` indefinida (CommentModal dormente) | Média | Decisão pendente |
| TD-011 | Componentes >300 linhas | Média | Parcialmente tratado (remoção de dead code 2026-09-22) |

Leitura completa: `docs/TASKS.md` — **Anexo A** (dívida técnica, 50 entradas / 48 únicos) e **Anexo B** (fila de refatoração, P1 #8–#10 abertos).

---

## 6. Avisos para o Próximo Agente

1. **Única fonte de diretrizes:** `AGENTS.md` indexa estritamente os 6 arquivos-canônicos na raiz de `docs/` (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`). Não existem subpastas (`docs/adr/` foi eliminada após consolidação integral) nem documentos vigentes fora destes 6.
2. **Não regressar o design:** tokens `telemetry-*` são obrigatórios; classes `bg-gray-*`, `bg-sky-*`, `bg-emerald-*` são proibidas nas páginas principais; rodar `pnpm test:design` antes de encerrar.
3. **Somente `pnpm`** (nunca `npm`).
4. **Código legado** (pré-2026-07-20) só sob feature/bug crítico/item de `TASKS.md` (Anexo B), com raio mínimo, teste de caracterização antes (`RULES.md` §7) e documentação no PR.
5. **Husky/lint-staged** estão no `package.json` mas `.husky/` não existe — hooks provavelmente inativos (`RULES.md` §4).

---

---

## 7. Histórico Recente de Entregas

- **2026-10-17:**
  - **Editar Placar direto (sem interrupção por Análise do Set):** Em [use-scoring-page-chrome.ts](file:///c:/apps/RKT/src/app/match/[id]/scoring/use-scoring-page-chrome.ts), inibida a abertura automática do modal `SetSummaryModal` durante o carregamento inicial da partida e quando no fluxo de edição de placar (`state.activeModal === 'edit-score'` ou `?modal=edit-score`). Garante transição imediata para o modal de edição de placar. Testes de regressão adicionados em `useScoringPageChrome.edit-score-modal.test.ts`.
  - **Droplist de Rodada e Simplificação em Editar Informações:** Em [edit-match-info-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-sections.tsx), substituído o campo de texto `<TextInput>` por `<SelectField>` com a lista de opções padronizadas de rodadas (`ROUND_OPTIONS`), mantendo fallback seguro para rodadas customizadas pré-existentes. Removidos os campos desnecessários do formulário: **Categoria**, **Chave** e **Tipo de Quadra** (em [edit-match-info-grid-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-grid-sections.tsx)), mantendo o layout enxuto e preservando valores pré-existentes no envio. Testes de componentes atualizados em `EditMatchInfoModal.test.tsx`.
  - **Winner jamais cadastrado como ACE via detalhes do ponto:** Em [useScoringHandlers.point-processor.service.ts](file:///c:/apps/RKT/src/hooks/useScoringHandlers.point-processor.service.ts), removida a conversão indevida que transformava pontos com `tipo === 'winner'` do sacador e `rallyLength === 1` em `ACE`. Um ACE é registrado exclusivamente direto em `/scoring` ou via modal de detalhes do saque (`ServerEffectModal`). Todo ponto cadastrado via modal de detalhes do ponto com `tipo === 'winner'` é registrado como `WINNER`. Teste de regressão adicionado em `useScoringHandlers.test.ts`.

---

## 8. Handoffs Sugeridos

- `@arquitetura → @backend`: resolver TD-003 (RLS) e TD-002 (Zod) — bloqueiam segurança e consistência de contrato.
- `@backend → @qa`: endpoints refatorados prontos para characterization/integração.
- `@frontend → @qa`: dual-theme + guardrails Telemetry prontos para `pnpm test:design` e E2E de tema.
- `@qa → @arquitetura`: decidir destino de `NEXT_PUBLIC_COMMENT_FEATURE` (TD-057) e PWA cancelada (item N8 em `docs/TASKS.md`).
- `@arquitetura → @frontend`: biblioteca de componentes em `src/components/ui` — requer decisão de escopo.

---

*Documento atualizado em 2026-10-17.*

