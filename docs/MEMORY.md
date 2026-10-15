# MEMORY — RKT (Racket App)

> Diário de bordo técnico · Metodologia RE-DOC (Fase 4 — Auditoria de Qualidade e Histórico)
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.

**Última Atualização:** 2026-10-15
**Analisado por:** engenharia reversa e implementação sobre `main`

---

## 1. Estado Atual do Projeto

| Dimensão | Situação |
|---|---|
| Branch | `main` |
| Working tree | Limpo (após docs commit) |
| Foco atual | **Refatoração STE-DEV — `docs/PLANO_REFATORACAO_STEDEV.md`**: R-01 (glossário) ✓; R-03 em execução — fases UI-1..UI-8 concluídas, backlog `.tsx` >100L de 53 → **37** |
| Docs de processo | `AGENTS.md` (índice) + estritamente os 6 arquivos-canônicos em `docs/` |

---

## 2. Últimos Commits (linha do tempo recente)

| Data | Hash / Ref | Resumo |
|---|---|---|
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

## 7. Handoffs Sugeridos

- `@arquitetura → @backend`: resolver TD-003 (RLS) e TD-002 (Zod) — bloqueiam segurança e consistência de contrato.
- `@backend → @qa`: endpoints refatorados prontos para characterization/integração.
- `@frontend → @qa`: dual-theme + guardrails Telemetry prontos para `pnpm test:design` e E2E de tema.
- `@qa → @arquitetura`: decidir destino de `NEXT_PUBLIC_COMMENT_FEATURE` (TD-057) e PWA cancelada (item N8 em `docs/TASKS.md`).
- `@arquitetura → @frontend`: biblioteca de componentes em `src/components/ui` — requer decisão de escopo.

---

*Documento gerado em 2026-10-01. Atualizar a cada ciclo relevante de commits.*
