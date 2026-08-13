# Dívida Técnica — rkt

**Gerado em:** 2026-07-20  
**Por:** @arquitetura (Onda 0 — Discovery)  
**Status:** Vivo (atualizar a cada sprint)

---

## Resumo Executivo

| Categoria | Quantidade | Crítico | Alto | Médio | Baixo |
|-----------|------------|---------|------|-------|-------|
| **Testes** | 8 | 2 | 3 | 2 | 1 |
| **Segurança** | 5 | 1 | 2 | 1 | 1 |
| **Performance** | 4 | 0 | 2 | 1 | 1 |
| **Arquitetura** | 6 | 0 | 2 | 3 | 1 |
| **DX (Dev Experience)** | 4 | 0 | 1 | 2 | 1 |
| **TOTAL** | **27** | **3** | **10** | **9** | **5** |

---

## [TD-001] Ausência de Testes de Integração com Banco Real

- **Impacto:** Alto
- **Esforço:** G
- **Risco se ignorado:** Bugs de produção por diferenças entre mocks e comportamento real do Prisma
- **Proposta:** Implementar Testcontainers para PostgreSQL e rodar testes de integração com banco real
- **Owner sugerido:** @qa + @backend
- **Módulos afetados:** `src/app/api/**`, `src/services/**`

---

## [TD-002] Validação de Inputs Inconsistente nas APIs

- **Impacto:** Alto
- **Esforço:** M
- **Risco se ignorado:** Vulnerabilidades de segurança (injection), dados corrompidos
- **Proposta:** Padronizar validação com Zod em todas as API routes, criar helper `validatedRequest()`
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/app/api/**`
- **Status:** 🟡 Parcialmente resolvido
  - ✅ `POST /api/players` — Refatorado (70+ linhas → 2 linhas)
  - ✅ `GET /api/players` — Refatorado
  - ✅ `POST /api/admin/users` — Refatorado
  - ✅ `POST /api/matches` — Já usava Zod
  - ✅ `POST /api/auth/login` — Já usava Zod
  - ⏳ Pendentes: 8 APIs na REFACTOR_QUEUE.md (RF-005)

---

## [TD-003] Row-Level Security (RLS) Não Propagado Corretamente

- **Impacto:** Crítico
- **Esforço:** M
- **Risco se ignorado:** Vazamento de dados entre usuários/tenants, violação de isolamento
- **Proposta:** Implementar contexto RLS centralizado em `lib/rls-context.ts` e garantir propagação em todas as queries
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/lib/rls-context.ts`, `src/services/**Repository.ts`
- **Status:** 🟡 Characterization tests identificaram suspeitas:
  - setRLSUser(null) chama disable() mas não limpa contexto anterior explicitamente
  - AsyncLocalStorage pode vazar entre requests se não houver cleanup
  - Não há validação de user.id ou user.role (aceita qualquer string)
  - Não há helper para filtrar queries automaticamente (withRLS)
  - Race condition possível em requests concorrentes
  - Não há cleanup automático após request

---

## [TD-004] Endpoints sem Paginação

- **Impacto:** Alto
- **Esforço:** P
- **Risco se ignorado:** Performance degradada com crescimento de dados, DoS acidental
- **Proposta:** Implementar paginação padrão (query params `page`, `limit`) em todos os endpoints GET que retornam listas
- **Owner sugerido:** @backend
- **Módulos afetados:** `/api/players`, `/api/matches`, `/api/admin/users`
- **Status:** ✅ Parcialmente resolvido
  - ✅ `GET /api/players` — Paginação cursor-based implementada
  - ✅ `GET /api/matches` — Paginação cursor-based implementada
  - ✅ `GET /api/admin/users` — Paginação cursor-based + filtro role implementado
  - ⏳ Pendentes (baixa prioridade):
    - `GET /api/matches/suspended-sessions`
    - `GET /api/matches/tournament-suggestions`

---

## [TD-005] Mistura de Server/Client Components sem Critério Claro

- **Impacto:** Médio
- **Esforço:** G
- **Risco se ignorado:** Performance de renderização degradada, bundle size desnecessário
- **Proposta:** Auditar todos os componentes e mover lógica para Server Components sempre que possível; documentar critérios para `"use client"`
- **Owner sugerido:** @frontend
- **Módulos afetados:** `src/app/**`, `src/components/**`

---

## [TD-006] Ausência de Tratamento de Erro Centralizado

- **Impacto:** Alto
- **Esforço:** M
- **Risco se ignorado:** Stack traces expostos, UX inconsistente, dificuldade de debugging
- **Proposta:** Criar error boundary global + handler de erros de API centralizado (`src/lib/error-handler.ts`)
- **Owner sugerido:** @backend + @frontend
- **Módulos afetados:** `src/app/api/**`, `src/app/error.tsx`, `src/app/global-error.tsx`
- **Status:** ✅ Resolvido (Onda 1 — Guardrails)
  - ✅ `handleApiError()` implementado
  - ✅ 6 classes de erro tipadas (`ApiError`, `ValidationError`, etc.)
  - ✅ 18 APIs com error handling padronizado
  - ✅ Error boundaries: `error.tsx` + `global-error.tsx`
  - ✅ Stack traces protegidos em produção
  - ✅ UI de erro consistente

---

## [TD-007] Scoring Engine com Dependências Externas

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** Dificuldade de teste, acoplamento desnecessário
- **Proposta:** Isolar completamente `src/core/scoring/**` como biblioteca pura (zero dependências de UI/DB)
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/core/scoring/**`

---

## [TD-008] Secrets Potencialmente Hardcoded

- **Impacto:** Crítico
- **Esforço:** P
- **Risco se ignorado:** Vazamento de credenciais, violação de segurança
- **Proposta:** Auditar código em busca de strings que pareçam secrets; garantir que todos os secrets venham de `process.env`
- **Owner sugerido:** @qa + @backend
- **Módulos afetados:** Todo o códigobase
- **Status:** 🔴 Identificado: `src/app/api/matches/route.ts:49` — `JWT_SECRET` sendo codado inline em vez de usar helper centralizado

---

## [TD-009] Ausência de Rate Limiting

- **Impacto:** Alto
- **Esforço:** M
- **Risco se ignorado:** DoS, abuso de API, custos de infraestrutura
- **Proposta:** Implementar rate limiting (ex: `next-rate-limiter`) em endpoints críticos (login, criação de partidas)
- **Owner sugerido:** @backend
- **Módulos afetados:** `/api/auth/login`, `/api/matches`, `/api/suggestions`

---

## [TD-010] Logs sem Estrutura (Structured Logging)

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Dificuldade de debugging em produção, impossibilidade de monitoramento
- **Proposta:** Adotar logs estruturados (JSON) com MDC (correlation IDs, user context)
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/lib/**`, `src/services/**`

---

## [TD-011] Componentes Gigantes (>300 linhas)

- **Impacto:** Médio
- **Esforço:** G
- **Risco se ignorado:** Dificuldade de manutenção, teste e reuso
- **Proposta:** Identificar componentes >300 linhas e extrair componentes menores; seguir SRP
- **Owner sugerido:** @frontend
- **Módulos afetados:** `src/components/scoring/**`, `src/app/match/**`
- **Status:** 🔴 Identificados: `EditScoreModal.tsx` (531 linhas), `PointDetailsModal.tsx` (358 linhas), `edit-score-form.tsx` (314 linhas)

---

## [TD-028] Characterization Tests Identificaram Comportamentos Suspeitos

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Bugs de validação passando despercebidos
- **Proposta:** Revisar suspeitas marcadas nos characterization tests e criar issues
- **Owner sugerido:** @backend + @qa
- **Módulos afetados:** `src/app/api/matches/route.ts`, `src/services/matchService.ts`
- **Status:** 🟡 Suspeitas identificadas:

### API (/api/matches/route.ts)
- Player1 === Player2 (mesmo jogador) — permitir?
- Validação de state query param — aceitar valores arbitrários?
- Limit máximo de paginação — não validado
- createdByUserId — está sendo setado corretamente?

### Service (matchService.ts)
- createMatch não valida player1 !== player2
- updateMatch permite atualizar qualquer campo (não há whitelist rigorosa)
- deleteMatch soft delete não limpa dados relacionados (pointLog, sessions)
- Permite transição direta de SCHEDULED para FINISHED (pula IN_PROGRESS)

---

## [TD-012] Ausência de Documentação de Componentes

- **Impacto:** Baixo
- **Esforço:** M
- **Risco se ignorado:** Dificuldade de onboarding, reuso inconsistente
- **Proposta:** Documentar componentes com Storybook ou MDX
- **Owner sugerido:** @frontend
- **Módulos afetados:** `src/components/**`

---

## [TD-013] Testes E2E Frágeis (Dependência de Timing)

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** Testes flaky, perda de confiança na suíte
- **Proposta:** Substituir `setTimeout` e esperas fixas por esperas explícitas do Playwright (`waitForSelector`, `waitForResponse`)
- **Owner sugerido:** @qa
- **Módulos afetados:** `e2e/flows/*.spec.ts`

---

## [TD-014] Ausência de Testes de Acessibilidade

- **Impacto:** Alto
- **Esforço:** M
- **Risco se ignorado:** Produto inacessível, problemas legais, exclusão de usuários
- **Proposta:** Integrar axe-core nos testes de componente e E2E
- **Owner sugerido:** @qa + @frontend
- **Módulos afetados:** `src/components/**`, `e2e/flows/**`

---

## [TD-015] Mutation Testing Não Integrado no CI

- **Impacto:** Baixo
- **Esforço:** P
- **Risco se ignorado:** Falsa sensação de segurança (testes que não testam de verdade)
- **Proposta:** Rodar Stryker no CI com threshold mínimo de 60%
- **Owner sugerido:** @qa
- **Módulos afetados:** `.github/workflows/ci.yml`, `stryker.config.json`
- **Status:** 🟡 Em progresso (Sprint 2 — item 2.1 — 2026-07-25)
  - ✅ Workflow consolidado: `test.yml` + `quality.yml` + `spec-drift-check.yml`
    unificados em `.github/workflows/ci.yml` (item 2.5).
  - ✅ Padronização `pnpm` em todos os jobs do CI (era `npm` em
    `spec-drift-check.yml` — bloqueador silencioso do próprio TD-015).
  - ✅ Thresholds `stryker.config.json` elevados: `low 50→60`, `break 40→50`,
    `high 70→80` (alinhado à meta de 90%+ line coverage de scoring).
  - ✅ Mutation testing migrado para job **opt-in** (`workflow_dispatch` com
    `run_mutation=yes`, ou PR com label `run:mutation`). **Sem cron** —
    decisão de calibração da sprint (job semanal não agregaria valor sobre
    o pipeline `quality` que já passa por PR).
  - ✅ Relatório HTML publicado como artifact (`stryker-report`, 30 dias).
  - ⏳ Caracterização que mata mutantes sobreviventes em `scoring-logic.ts`
    e `engine.ts` — pendente Sprint 2 item 2.2 (≥20 testes).
  - ⏳ Sprint 4: elevar `low 60→70`, `break 50→60`.

---

## [TD-016] NFRs Não Definidos Formalmente

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Impossibilidade de medir qualidade, performance degradada sem alerta
- **Proposta:** Definir SLOs/SLAs (ex: p95 < 2s, uptime 99.9%, LCP < 2.5s)
- **Owner sugerido:** @arquitetura
- **Módulos afetados:** `docs/architecture/NFRs.md`

---

## [TD-017] Ausência de Monitoramento e Alertas

- **Impacto:** Alto
- **Esforço:** G
- **Risco se ignorado:** Problemas em produção não detectados, MTTR alto
- **Proposta:** Integrar Micrometer, Prometheus, Grafana ou serviço SaaS (Sentry, Datadog)
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/lib/**`, `src/app/api/**`

---

## [TD-018] Scripts de Migration sem Rollback

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** Impossibilidade de reverter migrations problemáticas
- **Proposta:** Criar scripts de down migration para cada migration; testar rollback em staging
- **Owner sugerido:** @backend
- **Módulos afetados:** `prisma/migrations/**`

---

## [TD-019] Ausência de Contrato de API (OpenAPI/Swagger)

- **Impacto:** Baixo
- **Esforço:** M
- **Risco se ignorado:** Dificuldade de integração, documentação desatualizada
- **Proposta:** Gerar OpenAPI spec automaticamente (ex: `next-swagger-doc`)
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/app/api/**`, `specs/api-contracts.md`

---

## [TD-020] Dependências de Desenvolvimento Desatualizadas

- **Impacto:** Baixo
- **Esforço:** P
- **Risco se ignorado:** Vulnerabilidades de segurança, incompatibilidade futura
- **Proposta:** Rodar `pnpm outdated` e atualizar dependências de dev (Jest, Playwright, ESLint)
- **Owner sugerido:** @backend
- **Módulos afetados:** `package.json`

---

## [TD-021] Ausência de Scripts de Cleanup de Dados de Teste

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Banco de teste poluído, testes não determinísticos
- **Proposta:** Implementar cleanup automático após testes E2E (truncar tabelas)
- **Owner sugerido:** @qa
- **Módulos afetados:** `e2e/helpers/`, `tests/setup.ts`

---

## [TD-022] Variáveis de Ambiente Não Validadas

- **Impacto:** Alto
- **Esforço:** P
- **Risco se ignorado:** Erros em runtime por env missing, dificuldade de debug
- **Proposta:** Usar `zod` para validar `process.env` no startup da aplicação
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/lib/env.ts` (novo)

---

## [TD-023] Ausência de Health Checks

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Impossibilidade de monitorar saúde da aplicação (DB, filas, etc.)
- **Proposta:** Criar endpoint `/api/health` com checks de DB, cache, filas
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/app/api/health/route.ts` (novo)

---

## [TD-024] Error Messages Não Internacionalizadas

- **Impacto:** Baixo
- **Esforço:** M
- **Risco se ignorado:** UX ruim para usuários não-portugueses, dificuldade de expansão
- **Proposta:** Centralizar mensagens de erro em dicionário; preparar para i18n
- **Owner sugerido:** @frontend
- **Módulos afetados:** `src/lib/errors.ts`, `src/components/**`

---

## [TD-025] Ausência de Performance Budgets

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Degradação gradual de performance sem alerta
- **Proposta:** Definir budgets (bundle size, LCP, FCP) e falhar build se exceder
- **Owner sugerido:** @frontend + @qa
- **Módulos afetados:** `next.config.ts`, `.github/workflows/ci.yml`

---

## [TD-026] Duplicação de Lógica de Validação

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** Inconsistência, bugs de validação
- **Proposta:** Consolidar validação em `src/schemas/` e reutilizar em services + components
- **Owner sugerido:** @backend + @frontend
- **Módulos afetados:** `src/schemas/**`, `src/services/**`, `src/components/**`

---

## [TD-027] Ausência de Feature Flags

- **Impacto:** Baixo
- **Esforço:** M
- **Risco se ignorado:** Dificuldade de deploy gradual, rollbacks caros
- **Proposta:** Implementar feature flags (ex: `unleash`, `launchdarkly`, ou simples env-based)
- **Owner sugerido:** @backend
- **Módulos afetados:** `src/lib/feature-flags.ts` (novo)

---

## [TD-028] Auto-add de sets perdido na extração de useEditScoreModal

- **Impacto:** Alto
- **Esforço:** M
- **Risco se ignorado:** Recurso de auto-add de sets ao digitar placar completo (ex: 6-2) não funciona; UX degradada no modal "Editar Placar". 17 testes em `EditScoreModal.no-auto-add.test.tsx`, `EditScoreModal.matchFinish.test.tsx` e `EditScoreModal.test.tsx` falham por essa causa.
- **Proposta:** Reimplementar a lógica de auto-add no hook `useEditScoreModal.ts` usando a função `shouldAutoAddSet` (já existe em `edit-score-logic.ts` mas está sem uso) e a ref `lastAutoAddRef` (já declarada no hook mas sem uso). A implementação original estava inline em `EditScoreModal.tsx` (ver `git show HEAD:src/components/scoring/EditScoreModal.tsx`) antes da extração.
- **Owner sugerido:** @frontend
- **Módulos afetados:** `src/components/scoring/useEditScoreModal.ts`, `src/components/scoring/EditScoreModal.tsx`, `src/components/scoring/__tests__/EditScoreModal.no-auto-add.test.tsx`
- **Status:** ✅ Resolvido (2026-07-25) — Sprint 0 (feature) + Sprint 2 (tests) do plano de elevação.
  - ✅ Sprint 0: Lógica de auto-add re-implementada via `useEffect` em
    `useEditScoreModal.ts`, usando `shouldAutoAddSet` (de `edit-score-logic.ts`)
    + `lastAutoAddRef` para idempotência.
  - ✅ Sprint 2: Guarda `inputTouchedRef` adicionada ao useEffect para
    evitar o auto-add prematuro quando o player2 ainda não foi "touched"
    (regressão do commit `c215abd` finalmente mitigada). Touched refs
    resetados no re-open/close do modal.
  - ✅ Tests residuais (TD-030) agora 100% verdes — ver TD-030 para
    detalhes das correções de UI associadas (`startIndex={0}`,
    `editableCompletedSets` inclui `state.newSets`,
    `getStatusMessage` com branch para match tiebreak em andamento).

---

## [TD-029] Suites de API fragmentam mock de `@/lib/auth` (herança do modelo antigo)

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** ~13 suites de API route (`route.test.ts`,
  `state.route.test.ts`, `point.route.test.ts`, etc.) não conseguem invocar
  a route porque mockam `requireRole` ou `getUserFromRequest` individualmente
  mas **não exportam `withRLSHandler`** na mock — qualquer chamada de route
  hoje lança `TypeError: withRLSHandler is not a function`. Após o fix
  do `withRLSHandler` (Cluster C, Sprint 0.1) fazer fallback ao JWT, essas
  suites ainda falham porque continuam mockando a fragmentação antiga.
- **Proposta:** Padronizar o pattern de mockagem das suites de API:
  1. Stopp mockar `@/lib/auth` e `@/lib/rls-context` individualmente.
  2. Mockar `jose` (`jwtVerify`) — o `withRLSHandler` resolve a partir do JWT.
  3. Enviar headers `x-user-id` e `x-user-role` nos requests de teste
     quando quiser bypass de `getUserFromRequestScoped` (caminho do middleware real).
  4. Garantir que a mock de `@/lib/prisma` sempre inclua `$transaction`
     quando a route em questão usar `prisma.$transaction(cb)`.
- **Owner sugerido:** @backend → @qa
- **Módulos afetados:**
  - `src/app/api/matches/__tests__/route.test.ts`
  - `src/app/api/matches/[id]/__tests__/route.test.ts`
  - `src/app/api/matches/[id]/__tests__/state.route.test.ts`
  - `src/app/api/matches/[id]/__tests__/point.route.test.ts`
  - `src/app/api/matches/[id]/__tests__/events.route.test.ts`
  - `src/app/api/matches/[id]/sessions/__tests__/route.test.ts`
  - `src/app/api/matches/[id]/sessions/[sessionId]/abandon/__tests__/route.test.ts`
  - `src/app/api/matches/[id]/sessions/[sessionId]/endorse/__tests__/route.test.ts`
  - `src/app/api/matches/suspended-sessions/__tests__/route.test.ts`
  - `src/app/api/admin/users/__tests__/route.test.ts`
  - `src/app/api/admin/users/[id]/__tests__/route.test.ts`
  - `src/app/api/players/__tests__/route.test.ts` (parcial — só nas rotas pós-`withRLSHandler`)
  - `src/app/api/matches/__tests__/route.characterization.test.ts` (faz `fetch()` real — deveria ser E2E)
- **Status:** 🔴 Em dívida (2026-07-25) — Sprint 1 do plano de elevação.

---

## [TD-030] Tests de `EditScoreModal.no-auto-add` e `matchFinish` têm assumptions de UI inválidos

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** 15 testes permanecem falhando, gating de CI não
  pode ficar limpo, falsa sensação de como a UI renderiza.
- **Causa:** Após o fix do auto-add (TD-028), os testes que esperavam
  o texto "/Sets Completados/i" aparer/desaparecer baseado em newSets
  estavam invalidados. Diagnóstico Sprint 2 revelou 3 bugs subjacentes:
  1. Testes usavam `getAllByRole("spinbutton")` que capturava inputs
     tanto do `EditableSetsSummary` (sets completados) quanto do
     `SetInputForm` (set atual) quando `completedSets.length > 0` —
     atualizando os sets equivocados.
  2. `EditScoreModal.tsx` usava `startIndex={1}` (no `EditableSetsSummary`)
     fazendo o primeiro set completado ser rotulado de "Set 2".
  3. `EditScoreModal.tsx` derivava `editableCompletedSets` apenas de
     `state.editableCompletedSets` ou do prop — nunca incluindo
     `state.newSets`. Logo, auto-add adicionava a `newSets`, mas o set
     não ficava visível na lista de "Sets Completados".
  4. Auto-premature: `useEditScoreModal.ts` não exigia
     `inputTouchedRef.current.p1 && .p2` antes de disparar auto-add,
     então ao digitar "6" (p2="0" inicial) disparava para "6x0" —
     bug original que o commit `c215abd` havia tentado corrigir.
  5. `edit-score-form.tsx` retornava `null` no `getStatusMessage`
     quando `isMatchTiebreakSet && !isSetTrulyCompleted` (sem feedback
     ao usuário de que o match tiebreak ainda estava em andamento).
- **Resolução aplicada:**
  1. Testes reescritos para usar `getAllByPlaceholderText("0")` que
     seleciona apenas os inputs do `SetInputForm` (placeholder único).
  2. `EditScoreModal.tsx:126` corrigido para `startIndex={0}`.
  3. `EditScoreModal.tsx:86-100` refatorado para combinar
     `state.editableCompletedSets` + `state.newSets` na lista de
     sets completados exibidos.
  4. `useEditScoreModal.ts` useEffect de auto-add agora requer
     `inputTouchedRef.current.p1 && inputTouchedRef.current.p2`. Touched
     refs são resetados no re-open e no fechamento do modal.
  5. `edit-score-form.tsx:79-84` adicionou branch retornando
     "Match tiebreak em andamento — diferença de 2 pontos necessária".
- **Owner sugerido:** @qa → @frontend (concluído)
- **Módulos afetados:**
  - `src/components/scoring/EditScoreModal.tsx`
  - `src/components/scoring/useEditScoreModal.ts`
  - `src/components/scoring/edit-score-form.tsx`
  - `src/components/scoring/__tests__/EditScoreModal.no-auto-add.test.tsx`
  - `src/components/scoring/__tests__/EditScoreModal.matchFinish.test.tsx`
- **Status:** ✅ Resolvido (2026-07-25) — Sprint 2 do plano de elevação.
  Todas as 7 suites de `EditScoreModal` agora passam (61/61 testes).
  Zero falhas no projeto inteiro (99/99 suites, 1200 testes passando).

---

## [TD-031] Violações jsx-a11y em componentes pré-existentes

- **Impacto:** Médio
- **Esforço:** M
- **Risco se ignorado:** Produto fica com barreiras de acessibilidade para usuários
  dependentes de tecnologia assistiva (leitor de tela, navegação por teclado).
- **Proposta:** Resolver as 30+ violações abaixo (Sprint 3 capturou via
  `eslint-plugin-jsx-a11y` ao ativar a regra recommended):
  - `<div onclick>` sem `onkeydown`/`role=button` — converter para `<button>`
    ou adicionar `role` + `tabIndex={0}` + handler de teclado.
  - `<input>` sem `<label>` associado (`label-has-associated-control`)
    — adicionar `htmlFor`/`aria-label` ou usar `<label>` wrapping.
  - `autoFocus` em `edit-score-form.tsx` — substituir por `useRef` + `.focus()` em `useEffect`.
  - `:focus` mobile sem tabIndex positivo.
  - `<nav role="tablist">` em `dashboard/page.tsx:418` — adicionar
    `<button role="tab">` ou `role="presentation"` em filhos diretos
    para evitar atribuição de role interativa em elemento não-interativo.
- **Owner sugerido:** @frontend
- **Módulos afetados (amostra):**
  - `src/app/atletas/EditAthleteModal.tsx`, `src/app/atletas/RankingForm.tsx`,
    `src/app/atletas/page.tsx`
  - `src/app/dashboard/page.tsx`, `src/app/dashboard/__tests__/*`
  - `src/app/match/new/components/DateTimeSection.tsx`,
    `src/app/match/new/components/MatchDetailsSection.tsx`,
    `src/app/match/new/components/NewAthleteModal.tsx`,
    `src/app/match/new/components/ServerSelectionModal.tsx`,
    `src/app/match/new/components/DuplicateMatchModal.tsx`
  - `src/app/matches/locate/page.tsx`
  - `src/components/dashboard/MatchCard.tsx`,
    `src/components/dashboard/DeleteMatchModal.tsx`,
    `src/components/dashboard/FinishMatchModal.tsx`
  - `src/components/scoring/EditScoreModal.tsx`,
    `src/components/scoring/PointDetailsModal.tsx`,
    `src/components/scoring/ResumeAnnotationModal.tsx`,
    `src/components/scoring/ScoreboardCard.tsx`,
    `src/components/scoring/ServerEffectModal.tsx`,
    `src/components/scoring/UndoConfirmModal.tsx`,
    `src/components/scoring/edit-score-form.tsx`
- **Status:** 🟡 Em andamento (Sprint 4 — Code Hygiene)
  - ✅ Lint warning surface estabelecida: `next lint` exit 0 (warnings only).
  - ✅ Sprint 3 não introduziu regressões: warnings são pré-existentes.
  - ✅ Meta Sprint 3 aceita: 0 violations critical/serious em fluxo
    criar-partida/pontuar via axe-core (warning-level no lint).
  - ✅ Sprint 4 parcial: 2 violações `no-autofocus` resolvidas:
    - `src/components/scoring/edit-score-form.tsx` (linha 136 → useRef + useEffect)
    - `src/app/match/new/components/NewAthleteModal.tsx` (linha 307 → useRef + useEffect)
  - ⏳ 55 violações restantes em 4 categorias:
    - `click-events-have-key-events` (17)
    - `no-static-element-interactions` (17)
    - `label-has-associated-control` (16)
    - `control-has-associated-label` (5)
  - Próxima sprint dedicada: resolver categorias restantes.

---

## [TD-032] Função redo não exposta na UI (apenas undo implementado)

- **Impacto:** Médio
- **Esforço:** P
- **Risco se ignorado:** Anotadores não conseguem refazer pontos desfeitos
  sem reabrir a modal de editar placar manualmente (UX degradada em uso de tablet).
- **Proposta:** Adicionar botão "Refazer" na `ActionBar.tsx` (ao lado de "↩ Corrigir")
  que chama `engine.replayCurrentPoint()`. Engine já expõe
  `replayCurrentPoint` em `engine.history.ts:20`, basta wire-up com
  `useScoringHandlers.ts`. Persistir via `persistState(state, "redo")`
  usando o mesmo path de undo (`label="redo"`).
- **Owner sugerido:** @frontend
- **Módulos afetados:**
  - `src/components/scoring/ActionBar.tsx`
  - `src/hooks/useScoringHandlers.ts`
  - `src/core/scoring/engine.history.ts:20` (já existe)
- **Status:** 🟡 Em débito (Sprint 3 — feature verification)
  - ✅ Spec `04-undo-redo.spec.ts` cobre undo + documenta ausência
    de redo na UI via asserção `redoButton.count() === 0`.

---

## Priorização Sugerida (Primeira Sprint)

### Críticos (Resolver Imediatamente)
1. **TD-003** — RLS não propagado
2. **TD-008** — Secrets hardcoded
3. **TD-001** — Ausência de testes de integração

### Altos (Próxima Sprint)
4. **TD-002** — Validação inconsistente
5. **TD-004** — Endpoints sem paginação
6. **TD-006** — Tratamento de erros
7. **TD-009** — Rate limiting
8. **TD-014** — Testes de acessibilidade
9. **TD-017** — Monitoramento
10. **TD-022** — Validação de env
11. **TD-028** — Auto-add de sets perdido (regressão em uso)

### Médios (Backlog)
11. **TD-005** — Server/Client Components
12. **TD-007** — Scoring Engine isolada
13. **TD-010** — Logs estruturados
14. **TD-011** — Componentes gigantes
15. **TD-013** — Testes E2E frágeis
16. **TD-016** — NFRs definidos
17. **TD-018** — Rollback de migrations
18. **TD-021** — Cleanup de dados de teste
19. **TD-023** — Health checks
20. **TD-025** — Performance budgets
21. **TD-026** — Validação duplicada

### Baixos (Quando possível)
22. **TD-012** — Documentação de componentes
23. **TD-015** — Mutation testing no CI
24. **TD-019** — Contrato OpenAPI
25. **TD-020** — Dependências atualizadas
26. **TD-024** — i18n de erros
27. **TD-027** — Feature flags
28. **TD-028** — Auto-add de sets perdido (ver lista "Altos")
29. **TD-031** — Violações jsx-a11y pré-existentes
30. **TD-032** — Função redo não exposta na UI

---

## Tickets Formais (Sprint 4 — Code Hygiene)

Tickets TD-033 a TD-045 foram extraídos dos `// SUSPECT: TD-XXX` markers
nos characterization tests durante a Sprint de Code Hygiene (Onda 2).

Cada ticket abaixo referencia o test específico que o documenta e propõe
a correção. Status inicial: 🟡 Backlog.

### [TD-033] `createMatch` permite player1 === player2 (mesmo jogador)

- **Origem:** `src/services/__tests__/matchService.characterization.test.ts:184`
- **Impacto:** Médio — invariante de domínio violada silenciosamente
- **Esforço:** P
- **Proposta:** Adicionar validação `player1Id !== player2Id` em `createMatch`
  + lançar `ValidationError` antes de chamar `prisma.match.create`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — validação dupla: `matchService.createMatch` lança `ValidationError` + schema Zod em `CreateMatchInputSchema.refine(...)`
- **Arquivos:** `src/services/matchService.ts:36-40`, `src/schemas/contracts.ts:280-302`

---

### [TD-034] `updateMatch` aceita qualquer campo (sem whitelist)

- **Origem:** `src/services/__tests__/matchService.characterization.test.ts:351`
- **Impacto:** Alto — superfície de ataque para privilege escalation
- **Esforço:** M
- **Proposta:** Implementar whitelist explícita de campos atualizáveis
  (`category`, `scheduledAt`, `venueId`, etc.) + Zod schema `.partial()`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — whitelist `ALLOWED_FIELDS` em `updateMatch`
  filtra silenciosamente campos não permitidos antes de chamar Prisma
- **Arquivos:** `src/services/matchService.ts:68-130`

---

### [TD-035] `deleteMatch` soft delete não limpa `pointLog` e `sessions`

- **Origem:** `src/services/__tests__/matchService.characterization.test.ts:436`
- **Impacto:** Médio — RGPD/LGPD retention, vazamento de dados órfãos
- **Esforço:** M
- **Proposta:** Adicionar cascade explícito (ou hard delete com `$transaction`)
  em `deleteMatch` para limpar dados relacionados
- **Owner sugerido:** @backend
- **Status:** ✅ Parcialmente resolvido (2026-07-28) — hard delete já usava
  `$transaction` cascade. **Soft delete propositadamente preserva histórico**
  (LGPD retention). Stats adicionados ao retorno para auditoria.
- **Arquivos:** `src/services/matchService.ts:136-150`

---

### [TD-036] Transição direta `SCHEDULED → FINISHED` (pula `IN_PROGRESS`)

- **Origem:** `src/services/__tests__/matchService.characterization.test.ts:621`
- **Impacto:** Alto — corrompe auditoria/histórico da partida
- **Esforço:** P
- **Proposta:** Adicionar `validateTransition` em `updateMatch` para garantir
  transições válidas (`SCHEDULED → IN_PROGRESS → FINISHED`)
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `ALLOWED_TRANSITIONS` em
  `validateTransitionState` rejeita pular `IN_PROGRESS`. `IN_PROGRESS → IN_PROGRESS`
  permitido para edição de placar (`allowScoreEdit`).
- **Arquivos:** `src/services/matchValidator.ts:67-89`

---

### [TD-037] `annotationSessionService` (client) usa `sessionStorage` direto

- **Origem:** `src/services/__tests__/annotationSessionService.characterization.test.ts:102`
- **Impacto:** Médio — sem refresh token, expiração silenciosa
- **Esforço:** M
- **Proposta:** Encapsular `getSessionToken()` em helper que faz refresh
  automático ou retorna erro estruturado quando expirado
- **Owner sugerido:** @backend
- **Status:** 🟡 Parcialmente resolvido (2026-07-28) — `validateId()` adicionado
  para garantir `matchId`/`sessionId` não-vazios. Refresh token permanece
  como dívida separada (TD-037 refresh strategy).
- **Arquivos:** `src/services/annotationSessionApi.ts:4-8`

---

### [TD-038] `markSessionAbandoned` engole todos os erros silenciosamente

- **Origem:** `src/services/__tests__/annotationSessionService.characterization.test.ts:374`
- **Impacto:** Alto — perda de auditoria de partidas abandonadas
- **Esforço:** P
- **Proposta:** Trocar `void fetch().catch(() => null)` por retry com backoff
  + log de erro via `logger.session.abandonFailed`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — fetch agora `await`ado + log via
  `logger.session.abandonFailed` em falha. Retry com backoff fica para
  sprint dedicada (próximo ticket).
- **Arquivos:** `src/services/annotationSessionApi.ts:92-127`,
  `src/lib/logger.ts` (`session.abandonFailed`)

---

### [TD-039] `markSessionAbandoned` não retorna sucesso/fracasso

- **Origem:** `src/services/__tests__/annotationSessionService.characterization.test.ts:384`
- **Impacto:** Baixo — UX não tem como reagir a falha
- **Esforço:** P
- **Proposta:** Retornar `Promise<{ synced: boolean }>` ao invés de `Promise<void>`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — assinatura agora `Promise<{ synced: boolean }>`
- **Arquivos:** `src/services/annotationSessionApi.ts:92`,
  `src/services/useAnnotationSession.ts:25-29`

---

### [TD-040] API `/api/matches` aceita `format` inválido (não enum)

- **Origem:** `src/app/api/matches/__tests__/route.characterization.test.ts:264`
- **Impacto:** Alto — input não validado pode quebrar engine
- **Esforço:** P
- **Proposta:** Trocar `z.string()` por `z.nativeEnum(TennisFormat)` em
  `CreateMatchInputSchema.format`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `format: MatchFormatSchema` (z.enum)
  no schema Zod. Routes rejeitam com 400.
- **Arquivos:** `src/schemas/contracts.ts:283`

---

### [TD-041] API `/api/matches` aceita `player1 === player2`

- **Origem:** `src/app/api/matches/__tests__/route.characterization.test.ts:349`
- **Impacto:** Médio — espelha TD-033 mas na camada de input
- **Esforço:** P
- **Proposta:** Adicionar `.refine(d => d.player1Id !== d.player2Id, ...)` no schema
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `.refine(player1Id !== player2Id)`
  em `CreateMatchInputSchema`. Validação dupla com service layer.
- **Arquivos:** `src/schemas/contracts.ts:299-303`

---

### [TD-042] API `/api/matches` GET não valida `state` query param

- **Origem:** `src/app/api/matches/__tests__/route.characterization.test.ts:133`
- **Impacto:** Baixo — query param aceito mas resultado é vazio
- **Esforço:** P
- **Proposta:** Validar `state` contra enum (`SCHEDULED|IN_PROGRESS|FINISHED`)
  e retornar 400 se inválido
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `MatchStateSchema.safeParse` valida
  query param; 400 retornado se inválido.
- **Arquivos:** `src/app/api/matches/route.ts:15-28`

---

### [TD-043] `GET /api/matches` limit sem teto máximo (pode DoS)

- **Origem:** `src/app/api/matches/__tests__/route.characterization.test.ts:169`
- **Impacto:** Alto — DoS acidental
- **Esforço:** P
- **Proposta:** `extractPagination` deve cap `limit` em 100 (constante em `constants.ts`)
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `PAGINATION_LIMITS = { DEFAULT: 20, MAX: 100 }`
  exportado de `api-helpers.ts`. `extractPagination` e `extractPagePagination`
  ambos aplicam cap + validação contra NaN/negativos.
- **Arquivos:** `src/lib/api-helpers.ts:90-127`

---

### [TD-044] JWT_SECRET pode ter sido codificado inline em algum path

- **Origem:** `src/app/api/matches/__tests__/route.characterization.test.ts:9`
- **Impacto:** Crítico — secrets hardcoded
- **Esforço:** P
- **Proposta:** Auditar todos os `import { JWT_SECRET } from ...` e garantir
  uso exclusivo de `getJWTSecret()` de `@/lib/jwt`
- **Owner sugerido:** @qa + @backend
- **Status:** ✅ Resolvido (2026-07-28) — `src/app/api/auth/login/route.ts`
  migrado para `getJWTSecret()`. Auditoria completa via grep: zero ocorrências
  de `process.env.JWT_SECRET` em código de produção (apenas `lib/jwt.ts` e
  test helpers, que são intencionais).
- **Arquivos:** `src/app/api/auth/login/route.ts:9,28,40`

---

### [TD-045] `createdByUserId` em `createMatch` pode não estar sendo setado

- **Origem:** `src/services/__tests__/matchService.characterization.test.ts:172`
- **Impacto:** Médio — quem criou a partida fica sem auditoria
- **Esforço:** P
- **Proposta:** Verificar que `currentUserId` (já disponível via `getRLSUser()`)
  está sendo passado para `prisma.match.create.data.createdByUserId`
- **Owner sugerido:** @backend
- **Status:** ✅ Resolvido (2026-07-28) — `currentUserId` já é passado
  para `createMatch(input, currentUserId, tx)` em `src/app/api/matches/route.ts:54`.
  Logger.warn adicionado para auditoria quando `createdByUserId` é ausente.
- **Arquivos:** `src/services/matchService.ts:42-45`

---

### [TD-046] Auditoria `editScoreHelpers.ts` vs `edit-score-logic.ts` (Sprint Code Hygiene)

- **Origem:** REFACTOR_QUEUE item 11 ("parcialmente resolvida, needs audit")
- **Impacto:** Baixo (apenas classificação arquitetural)
- **Esforço:** P (já feito)
- **Resultado da auditoria (Sprint Code Hygiene):**
  - `editScoreHelpers.ts` (241L) — **PRIMITIVOS**: `validateSetResult`,
    `validateMatchTiebreakInput`, `setsToWinForFormat`, `totalSetsForFormat`,
    `getNextServerAfterSet`, `SetEditData`, `SetValidation`.
  - `edit-score-logic.ts` (268L) — **ORQUESTRAÇÃO**: `calculateValidation`,
    `calculateMatchState`, `createSetEditData`, `shouldAutoAddSet`,
    `calculateNextServer`, interfaces de input state.
  - **Não há duplicação real.** `edit-score-logic.ts` importa as primitivas
    de `editScoreHelpers.ts` (linhas 5-10: `validateMatchTiebreakInput`,
    `validateSetResult`, `setsToWinForFormat`, `totalSetsForFormat`) e
    re-exporta o tipo `SetEditData`.
  - `useSessionManager.utils.ts` é o canônico para `isMatchTiebreakSet`
    (importado por `edit-score-logic.ts:11`).
- **Conclusão:** Manter como está. A separação de responsabilidades está
  correta (primitivos vs orquestração). Fechar ticket sem refactor.
- **Owner sugerido:** @frontend
- **Status:** ✅ Resolvido (2026-07-27) — Sprint Code Hygiene

---

## Como Atualizar

1. Ao identificar nova dívida: adicionar entrada neste arquivo
2. Ao começar trabalho: mover status para `in_progress`
3. Ao completar: mover para `done` e linkar PR/commit
4. Revisar em retrospectiva de sprint

---

## Referências

- **CURRENT_STATE:** `docs/architecture/CURRENT_STATE.md`
- **ADR-0001:** `docs/adr/ADR-0001-adocao-multiagente.md`
- **Agents:** `.agents/*.md`

---

## RLS PostgreSQL — Verificação DBA

### Contexto
O projeto usa Row Level Security (RLS) do PostgreSQL via `set_config('app.current_user_id', ...)`.
A configuração é setada em `src/lib/prisma.ts` no hook `$use` do Prisma, antes de cada query.

### Configuração atual
- `set_config(..., true)` — transaction-local (auto-reset ao fim da transação implícita da query)
- Cada request HTTP executa em seu próprio scope via `runWithRLS` (AsyncLocalStorage) — não vaza entre requests

### Verificações pedidas ao DBA
1. Confirmar que o role/migration aplicou as policies RLS às tabelas `Match`, `Player`, `MatchAnnotationSession`, `PointLog`, `User`.
2. Confirmar que `set_config('app.current_user_id', ..., true)` reset a config ao final de cada transação implícita (este é o comportamento default do PostgreSQL desde 9.6+).
3. Confirmar que connections no pool do Prisma ($poolSettings) NÃO herdam `set_config` entre checkouts (prisma client 5.x usa PgBouncer-like connection pooling por padrão em standby mode, com RESET ALL ao checkout).
4. Se houver query hooks customizados além de `$use`, garantir que estes também passam por transação.

### Risco residual
- Operações multi-statement sem `$transaction` explícita podem gravar config em uma query e ler em outra com conexão diferente (no-pool mode). Avaliar migração para `$transaction` em quaisquer caminhos suspeitos.

#### Inventário de `$transaction` no projeto (para documentação DBA)

| Local | Tipo | Finalidade |
|-------|------|-----------|
| `src/services/matchService.ts:116` | Array-batch (`[...]`) | Hard-delete de `Match`: `pointLog.deleteMany` + `matchAnnotationSession.deleteMany` + `match.delete` em sequência atômica. |
| `src/services/sessionService.ts:139` | Callback interativo (`async (tx) =>`) | `reactivateOrCreateSession`: abandona sessões antigas e reativa/cria a mais recente em uma transação. |
| `src/app/api/matches/route.ts:37` | Callback interativo (`async (tx) =>`) | `POST /api/matches`: verifica duplicidade via `findDuplicateMatch` e cria partida (`createMatch`) na mesma transação. |
| `src/app/api/matches/[id]/point/route.ts:52` | Callback interativo (`async (tx) =>`) | `POST /point`: carrega partida, valida regras de sequência/sacador e persiste `pointLog` + atualiza `scoreState` atomicamente. |

#### Dívida residual identificada — multi-statement sem `$transaction`

- **[TD-RLS-001]** `src/services/matchService.ts:61-89` — `updateMatch` executa `prisma.match.findFirst` seguido de `prisma.match.update` **fora de `$transaction`**. Duas transações implícitas distintas: (a) cada chamada reseta `app.current_user_id` ao fim da própria transação, mas (b) há risco de race condition (leitura-then-gravação não atômica) e, em no-pool mode, podem rodar em conexões diferentes. Avaliar migração para `prisma.$transaction(async (tx) => { ... })` mesclando find + update. Owner sugerido: @backend.

---

## Investigação @qa — Falhas Pré-Existentes Dashboard (2026-07-28)

### [TD-046] Testes de Dashboard falham após refatoração para landing page pública

- **Origem:** Investigação @qa (Sprint Code Hygiene — Sprint 4)
- **Impacto:** Médio — 19 testes falhando (6 em DashboardAnnotatedView + 13 em HamburgerMenu)
- **Esforço:** M
- **Risco se ignorado:** Falsa sensação de cobertura de testes; CI gate não pode ficar limpo;
  regressões no dashboard passam despercebidas.
- **Causa raiz identificada:**
  - Commit `1511b97` ("feat: replace home redirect with landing page, add dashboard
    page and make it public for E2E tests") reduziu `src/app/dashboard/page.tsx`
    de 448 linhas para 7 linhas (stub mínimo).
  - Os testes `DashboardAnnotatedView.test.tsx` e `HamburgerMenu.test.tsx`
    foram escritos ANTES dessa mudança e esperam o componente completo:
    - View "Partidas Anotadas" com header `<h2>Partidas Anotadas</h2>`
    - Lista de MatchCards via `<MatchCard data-testid="match-card" />`
    - Estado vazio "Nenhuma partida anotada encontrada"
    - Botão "Voltar para Início" → `router.push('/dashboard')`
    - Menu hamburguer com `data-testid="hamburger-menu-button"`
    - Navegação `/match/[id]/report` ao clicar no card
  - Os hooks foram extraídos para `dashboard.hooks.ts`, `dashboard.actions.ts`,
    `dashboard.resume.ts` (separação saudável), mas o componente de UI nunca
    foi reescrito para usá-los.
- **Proposta de correção:**
  1. **Opção A (recomendada):** Reimplementar `dashboard/page.tsx` usando os hooks
     existentes (`useDashboardData`, `useDashboardNavigation`, `useUserAuth`)
     e os componentes de `src/components/dashboard/*` que existem
     (`MatchCard`, `HamburgerMenu`, `DeleteMatchModal`, `FinishMatchModal`).
     Restaurar as views (dashboard, history, annotated, live, pending, profile).
     Effort: M (1-2 sprints).
  2. **Opção B (rápida):** Marcar os 2 testes como `it.skip` com comentário
     explicativo referenciando este ticket + commit. Atualizar a documentação
     para refletir que a cobertura de dashboard está agora nos E2E tests
     (`e2e/flows/`). Effort: P.
  3. **Opção C (híbrida):** Migrar os 2 testes para `*.skip` AGORA (B) e abrir
     ticket separado para reescrever o dashboard (A).
- **Owner sugerido:** @qa (decisão entre A/B/C) + @frontend (implementação)
- **Status:** 🟡 Backlog — aguardando priorização
- **Arquivos afetados:**
  - `src/app/dashboard/__tests__/DashboardAnnotatedView.test.tsx` (6 testes falhando)
  - `src/app/dashboard/__tests__/HamburgerMenu.test.tsx` (13 testes falhando)
  - `src/app/dashboard/page.tsx` (7 linhas — stub)
  - `src/app/dashboard/dashboard.hooks.ts` (147 linhas — pronto para uso)
  - `src/app/dashboard/dashboard.actions.ts` (107 linhas — pronto para uso)
  - `src/app/dashboard/dashboard.resume.ts` (94 linhas — pronto para uso)

---

## [TD-033] Heuristica "isMatchTiebreakSet" duplicada com condicoes divergentes

- **Origem:** Bug #4/#5 (2026-08-07) - docs/fix-tasks/scoring-edit-score-2026-08-07.md
- **Impacto:** Medio
- **Esforco:** M
- **Risco se ignorado:** Inconsistencia entre engine live, modal de edicao e dashboard quando um formato novo for adicionado (cada copia da heuristica precisa ser atualizada individualmente; uma delas divergindo gera bugs similares ao #4)
- **Proposta:**
  1. Adicionar campo explicito isMatchTiebreak?: boolean em SetScore (src/core/scoring/types.ts:45-50) e grava-lo ao completar o set decisivo (em completeMatchTiebreak, handleGameWon para o BO5).
  2. Extrair a heuristica atual (em src/hooks/useSessionManager.utils.ts:isMatchTiebreakSet, versao mais completa) para um modulo unico em src/core/scoring/, e importar em TODOS os lugares que hoje duplicam: engine.flow.ts:366-370 (processTiebreakPoint), engine.flow.ts:463-467 (isSetComplete), engine.flow.ts:525-546 (isMatchTiebreakActive), editScoreHelpers.ts:222-233 (getNextServerAfterSet), edit-score-logic.ts:130-140 (calculateValidation).
  3. Considerar ADR-0005 formalizando a decisao de marcar o set decisivo com flag explicita em vez de inferir por ormat + sets.length.
- **Owner sugerido:** @backend + @arquitetura
- **Modulos afetados:** src/core/scoring/, src/components/scoring/, src/hooks/useSessionManager.utils.ts
- **Status:** Aberto. Mitigacao parcial aplicada (bug #4): saneador read-path em src/core/scoring/score-normalizer.ts que cobre o legado pre-existente; porem a fonte da inconsistencia continua.

---

## [TD-034] Falta de invariante "ultimo set do array = set em andamento" apos `buildNewScoringState` e `loadState`

- **Origem:** Bug do "set atual" (2026-08-13) - ajustar placar e voltar ao scoreboard com set finalizado ao fim do array
- **Impacto:** Medio (UX; corrige visual ao vivo sem ter que voltar aos cards)
- **Esforco:** P
- **Risco se ignorado:** Apos confirmar a edicao de placar com um set finalizado como ultimo item do array, o ScoreboardCard destacava o set finalizado em verde como se fosse o "atual" (em vez de aplicar o destaque ao set em andamento). O estado se autocorrigia ao voltar para a tela de cards (que re-aplica o estado via `isSetCompleted` semantico + `reconcileWithCanonicalState`), porem sem essa navegacao o bug persistia.
- **Proposta:**
  1. **FEITO (2026-08-13):** `buildNewScoringState` (src/hooks/useSessionManager.state-builder.ts) agora empurra um set vazio `{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }` ao final do array `newState.sets` quando `!isFinished` E o ultimo SetEditData confirmado esta finalizado (regras oficiais via `validateSetScore` ou fallback 6+2 / TB 7+2 / MT 10+2). Mantida a invariante "ultimo item = set em andamento" mesmo apos `loadState` (que so copia o estado sem normalizar).
  2. **FEITO (2026-08-13):** `ScoreboardCard` (src/components/scoring/ScoreboardCard.tsx:37-46) agora calcula `currentSetIndex` de forma semantica (ultimo set NAO-finalizado conforme `isSetCompleted`), em vez do critério posicional anterior `sets.length - 1`. A heuristica frágil `set.player1 > set.player2 || set.player2 > set.player1` em tres pontos (`getSetCellStyle`, header, `tfoot`) foi substituida por `isSetCompleted(set, tennisFormat)` para consistencia com o resto do app.
  3. **PENDENTE:** Considerar mover a garantia da invariante para dentro de `engine.state.ts:loadState` (src/core/scoring/engine.state.ts:35-37) — hoje `loadState` apenas copia; ele poderia normalizar o array `sets[]` ao final (empurrando set vazio se necessario). Isso protegeria qualquer outro chamador de `loadState` que possa surgir no futuro (ex.: `fromSerialized` em retomadas de banco). Avaliar ADR.
  4. **PENDENTE:** Avaliar mover `isSetCompleted` (src/app/match/[id]/scoring/scoringHelpers.ts) para `src/core/scoring/` para que `ScoreboardCard` e outras camadas de UI nao precisem importar de dentro de `app/match/[id]/scoring/` (acoplamento UI↔Route na hierarchy de pastas).
- **Owner sugerido:** @backend
- **Modulos afetados:** src/hooks/useSessionManager.state-builder.ts, src/components/scoring/ScoreboardCard.tsx, (futuro) src/core/scoring/engine.state.ts
- **Testes de caracterizacao adicionados:**
  - src/components/scoring/__tests__/ScoreboardCard.test.tsx (3 cenarios)
  - src/hooks/__tests__/useSessionManager.state-builder.test.ts (5 cenarios)
- **Status:** Correcao primaria FEITA. Melhorias pendentes (3)+(4) acima sao opcionais e de baixa prioridade.
