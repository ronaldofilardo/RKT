# ARCHITECTURE — RKT (Racket App)

> Gerado por engenharia reversa (RE-DOC) a partir do código-fonte.
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.
> **Data da atualização:** 2026-10-07 (Fase de Endurecimento)

---

## 1. Pilha de Tecnologia

| Camada | Tecnologia | Versão (package.json) | Evidência |
|---|---|---|---|
| Framework | **Next.js (App Router)** | `^15.3.0` | `next.config.ts` (`typedRoutes: true`) |
| Linguagem | **TypeScript** (strict) | `^5.5.0` | `tsconfig.json` → `strict: true`, `noUnusedLocals`, `noUnusedParameters` |
| UI | **React** | `^18.3.0` | `dependencies` |
| Estilo | **Tailwind CSS** + PostCSS/Autoprefixer | `^3.4.0` / `^8.5.15` | `tailwind.config.ts`, `postcss.config.js` |
| Banco | **PostgreSQL** + **Prisma ORM** | `^5.17.0` | `prisma/schema.prisma` (`provider = "postgresql"`) |
| Validação | **Zod** | `^3.23.0` | `src/schemas/*` (6 arquivos) |
| Auth | **JWT via `jose`** + `bcryptjs` | `^5.6.0` / `^2.4.3` | `src/middleware.ts`, `src/lib/auth.ts` |
| Cache offline | **IndexedDB (`idb`)** | `^8.0.0` | `src/lib/offlineDb.ts` |
| Imagens | **sharp** | `^0.33.5` | `dependencies` |
| Testes unitários | **Jest** + Testing Library | `^29.7.0` | `jest.config.js`, `tests/setup.ts` |
| Testes E2E | **Playwright** + `@axe-core/playwright` | `^1.46.0` / `^4.10.0` | `playwright.config.ts`, `e2e/flows/` |
| Mutation testing | **Stryker** | `^8.6.0` | `stryker.config.json` |
| Lint | **ESLint** + `eslint-config-next` + `jsx-a11y` | `^8.57.0` | `.eslintrc.json` |
| Package manager | **pnpm 9** (npm proibido) | — | `pnpm-lock.yaml`, `RULES.md` §10 |
| CI | **GitHub Actions** | — | `.github/workflows/quality.yml` (Node 22, Postgres 16) |
| Deploy | **Vercel** | — | `.vercel/`, `next.config.ts` |

**Variáveis de ambiente** (`.env.example`): `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, `DATABASE_URL`.

---

## 2. Estrutura de Pastas (comentada)

```
rkt/
├── .github/workflows/      # CI: quality.yml (typecheck + testes + coverage em Postgres 16)
├── docs/                   # Diretrizes do sistema (fonte única da verdade)
│   └── PRD.md … MEMORY.md  # **6 arquivos-canônicos** (única fonte de verdade para agentes)
├── e2e/                    # Testes Playwright
│   ├── flows/              # Ciclo completo, offline, undo/redo, conflito, sessão
│   └── helpers/            # auth, factories, expectNoAxeViolations (a11y)
├── prisma/
│   ├── schema.prisma       # 8 models + 6 enums (fonte da verdade do domínio)
│   ├── seed.ts             # Seed do banco
│   ├── migrations/         # 12 migrações (init → match_comments)
│   └── legacy_sql/         # SQL legado de migração anterior
├── public/                 # Assets estáticos
├── scripts/                # Infra de teste/build: run-tests, check-no-skipped-tests,
│                           # validate-spec-drift, create-test-db, mutation runner
├── src/
│   ├── app/                # App Router (14 pages + 25 API routes + error/not-found)
│   │   ├── api/            # Backend HTTP (auth, admin, players, matches/*)
│   │   ├── admin/          # Gestão de usuários (somente ADMIN)
│   │   ├── atletas/        # CRUD de atletas e rankings
│   │   ├── dashboard/      # Hub principal + hooks + components (TopBar/Sidebar/ViewRouter)
│   │   ├── login/          # Tela de autenticação
│   │   ├── match/new/      # Criação de partida (11 componentes + helpers/hooks)
│   │   ├── match/[id]/     # scoring/ (anotação) e report/ (relatório)
│   │   ├── matches/locate/ # Localizar partidas (rota pública)
│   │   ├── historico|partidasanotadas|partidasaovivo|dados-pessoais/  # aliases de view do dashboard
│   │   ├── aguardandoanotador/ # Espera anotador assumir (polling)
│   │   ├── globals.css     # Tokens Telemetry (light/dark) + resets
│   │   └── design-system.css # Tokens legacy Airtable (cores, tipografia, espaço)
│   ├── components/         # Componentes compartilhados
│   │   ├── scoring/        # ~35 componentes da tela de anotação
│   │   ├── dashboard/      # MatchCard + modais de deletar/finalizar
│   │   ├── report/         # AdvancedStats
│   │   ├── ThemeToggle.tsx # Alternância light/dark
│   │   └── Toast.tsx       # Notificações
│   ├── contexts/           # SessionContext, ThemeContext, Providers
│   ├── core/               # **Núcleo puro (sem I/O)**
│   │   ├── scoring/        # Engine de pontos, tiebreak, formatos, timeline rebuild
│   │   └── report/         # Cálculo de estatísticas (momentum, pressão, saque)
│   ├── hooks/              # useScoringHandlers, useSessionManager, offline sync
│   ├── lib/                # Infra transversal: auth, RLS, prisma, errors, logger,
│   │                       # match-events (SSE), offlineDb/offlineStorageSync, ranking
│   ├── schemas/            # Contratos Zod (match, player, user, annotation, rally)
│   ├── services/           # Camada de negócio: matchService, playerService,
│   │                       # annotationSessionService, matchRepository, adminService
│   ├── middleware.ts       # Guard de rota JWT + injeção x-user-* + RBAC
│   ├── test-helpers/       # Fábricas de token/header para testes
│   └── types/              # Declarações ambient (bcryptjs.d.ts)
├── tests/setup.ts          # Setup global do Jest
├── scratch/                # Artefatos temporários (33 arquivos, não versionados como código)
├── tailwind.config.ts      # Design tokens (Tailwind) + dual theme
├── next.config.ts          # Headers de segurança, typedRoutes, strict build
├── jest.config.js          # Cobertura mínima: 65% stmts / 80% branches
├── playwright.config.ts    # E2E single worker, webServer pnpm dev
└── stryker.config.json     # Mutation: engine.ts, scoring-logic.ts, types.ts (≥80% high)
```

---

## 3. Diagrama de Fluxo de Dados

```
┌─────────────┐   form/JSX    ┌──────────────────────────────────────────┐
│   Browser   │──────────────▶│  Next.js App Router (src/app)            │
│  (React 18) │               │  pages: dashboard / scoring / report ... │
└──────┬──────┘               └───────────────┬──────────────────────────┘
       │                                      │ fetch/POST + Bearer token
       │ IndexedDB (fila offline)             ▼
       │ src/lib/offlineDb.ts   ┌──────────────────────────────────────────┐
       │                        │ src/middleware.ts                        │
       │                        │  · redirect '/' → '/login'              │
       │                        │  · remove x-user-* forjados              │
       │                        │  · valida JWT (jose) → x-user-id/role    │
       │                        │  · RBAC: /admin exige role ADMIN         │
       │                        └───────────────┬──────────────────────────┘
       │                                        ▼
       │                        ┌──────────────────────────────────────────┐
       │                        │ API Routes (25) — src/app/api/**         │
       │                        │  · withRLSHandler (src/lib/auth.ts)      │
       │                        │  · handleApiError / ApiError             │
       │                        │  · validação Zod (src/schemas)           │
       │                        └───────────────┬──────────────────────────┘
       │                                        ▼
       │                        ┌──────────────────────────────────────────┐
       │                        │ Services (src/services)                  │
       │                        │  matchService · playerService            │
       │                        │  annotationSessionService · matchRepo    │
       │                        └───────────────┬──────────────────────────┘
       │                                        ▼
       │                        ┌──────────────────────────────────────────┐
       │                        │ Prisma Client → PostgreSQL (RLS)         │
       │                        │ users, Player, Match, PointLog,          │
       │                        │ match_score_edits, match_comments,       │
       │                        │ match_annotation_sessions,               │
       │                        │ annotation_endorsements                  │
       │                        └───────────────┬──────────────────────────┘
       │                                        │
       │   ┌────────────────────────────────────┤
       │   ▼                                    ▼
       │ ┌────────────────────────┐   ┌────────────────────────────────────┐
       │ │ src/core/scoring       │   │ src/lib/match-events.ts (EventBus) │
       │ │  ScoringEngine (puro)  │   │  → SSE GET /api/matches/:id/events│
       │ │  applyPoint/getState   │   │  tipos: point_scored, state_changed│
       │ │  tiebreak, formats     │   │        session_updated, comment_*  │
       │ └────────────────────────┘   └────────────────────────────────────┘
       │              │
       └──────────────┴──▶ UI (ScoreboardCard, Timeline, LiveCountersBar)
                          Telemetry Design System (light/dark)
```

**Caminho crítico de um ponto (ponto a ponto):**
`ScoringPage` → `useScoringHandlers.point-processor` → `POST /api/matches/[id]/point` → `matchService` (validação + transação) → `PointLog` (unique `matchId+clientEventId`, `matchId+sequenceNumber`) → `emitMatchEvent('point_scored')` → SSE → todos os clientes → `ScoringEngine.applyPoint` recalcula placar.

---

## 4. Decisões Estruturais Evidentes no Código

| Decisão | Onde | Observação |
|---|---|---|
| **Motor de regras puro** | `src/core/scoring/` | Sem I/O; testável isoladamente; único alvo do Stryker |
| **Repository + Services** | `src/services/matchRepository.ts`, `matchService.ts` | ADR-0004 (repository pattern) |
| **Strategy de formato** | `src/core/scoring/format-rules.ts` | ADR-0003 (match format strategy) |
| **Guard de rota centralizado** | `src/middleware.ts` | 1 arquivo, matcher explícito de 12 padrões |
| **Handler decorator p/ RLS** | `src/lib/auth.ts` `withRLSHandler` | 22 das 25 rotas (96 ocorrências em `src/`) — ponto único de contexto de segurança |
| **Normalização de eventos** | `clientEventId` + `sequenceNumber` únicos | Idempotência de sincronização offline |
| **Snapshots de edição de placar** | `MatchScoreEdit.previousScoreState/newScoreState` | Preserva timeline anterior à correção |
| **Diretrizes de trabalho** | `AGENTS.md` (índice dos 6) + `docs/RULES.md` | Fronteira legado/novo (pré/pós 2026-07-20) definida em `RULES.md` §10 |

---

## 5. Segurança Implementada

- **Headers** (global em `next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`.
- **JWT** assinado com `jose` (`sub`, `role`), lido de header `Authorization` ou cookies `rkt_access_token`/`access_token`.
- **Higienização de headers** no middleware: remove `x-user-id`/`x-user-role` forjados antes de reinjetar os reais.
- **Build estrito:** `ignoreBuildErrors: false`, `eslint.ignoreDuringBuilds: false`.

---

## 6. Decisões Arquiteturais Registradas (Consolidação de ADRs)

As decisões arquiteturais estruturantes do projeto foram consolidadas diretamente nesta seção como fonte canônica única:

### ADR-0002 — Sugestão de Partidas e Torneios Compatíveis
- **Problema:** Descoberta de partidas compatíveis por nível técnico, localização e formato.
- **Decisão:** Modelo de domínio baseado em `MatchingCriteria` e `MatchSuggestion`, executado em **polling sob demanda** (sem sobrecarga de ML para o MVP).
- **Critérios de Matching:** Nível técnico (ranking), proximidade de clube/localização, janela de horário e preferências de formato.
- **Rotas:** `GET /api/matches/tournament-suggestions`.

### ADR-0003 — Strategy Pattern para Formatos de Tênis
- **Problema:** Regras de 7 formatos de partida dispersas em múltiplos switches (`engine.flow.ts`, `lib/matchConfig.ts`, `components/scoring/editScoreHelpers.ts`).
- **Decisão:** Unificação via Strategy (`format-rules.ts` / interface de regras de formato). Cada formato encapsula: `setsToWin`, `gamesToTiebreak`, `usesNoAd`, `isMatchTiebreak`, `initialGames` e ativação de tiebreak no set final.
- **Formatos suportados:** `BEST_OF_3`, `BEST_OF_3_NO_AD`, `BEST_OF_3_MATCH_TB`, `BEST_OF_5`, `MATCH_TB_10`, `PRO_SET_8`, `SHORT_SET_2V2_NO_AD`.

### ADR-0004 — Repository Pattern para Acesso a Dados
- **Problema:** Singleton global do `PrismaClient` importado indiscriminadamente em controllers e services, violando DIP e dificultando mocks unitários.
- **Decisão:** Adoção do Repository Pattern (`src/services/matchRepository.ts`). Controllers HTTP não devem abrir transações Prisma diretas; a orquestração de persistência pertence aos repositories e services com suporte a `tx?: Prisma.TransactionClient`.

### ADR-0005 — Matriz de Capabilities para RBAC e Alinhamento com RLS
- **Problema:** A hierarquia linear numérica legada (`ROLE_HIERARCHY`: ADMIN > GESTOR > COACH > ATHLETE > SPECTATOR) fazia com que `COACH` herdasse cegamente capacidades de atleta (`ATHLETE`), quebrando os limites de perfil nos testes E2E (`05-role-boundaries.spec.ts`).
- **Decisão:** Adoção de matriz de permissões granulares por capabilities (`AppAction`) em `src/lib/auth.ts`:
  - `hasPermission(role: Role, action: AppAction): boolean` — verificação $O(1)$ de capacidade.
  - `requirePermission(request: NextRequest, action: AppAction)` — guard HTTP (401/403).
  - `withPermissionHandler(request, action, handler)` — wrapper de execução RLS.
  - Ações tipadas: `manage:users`, `manage:clubs`, `view:all_matches`, `score:match`, `view:tactical_stats`, `annotate:session`, `play:match`, `view:own_stats`, `view:public_matches`.

### ADR-0006 — Ciclo de Vida e Expiração de Sessões de Anotação (Locks Órfãos)
- **Problema:** Sessões de anotação concorrente (`MatchAnnotationSession`) permaneciam ativas indefinidamente quando anotadores fechavam o navegador ou perdiam sinal, travando anotações subsequentes.
- **Decisão:** Lease com timeout de inatividade de **4 horas** via `cleanupStaleSessions` (`src/services/sessionService.ts`). Sessões inativas há mais de 4h têm status transicionado para `ABANDONED` e lock liberado (`isActive: false`), mantendo snapshot para auditoria.

### ADR-0007 — Separação Conceitual entre User (Conta) e Player (Atleta)
- **Problema:** A tabela legada `Player` acumulava credenciais de acesso (`email`, `passwordHash`, `role`) com dados desportivos de quadra (`ranking`, `dominance`, `backhand`), impedindo o cadastro de atletas mirins sem e-mail ou o gerenciamento de múltiplos atletas por um treinador.
- **Decisão:** Desacoplamento arquitetural em fases:
  - **Fase Vigente:** Garantia de compatibilidade mantendo `model Player` com `createdByUserId`. O atleta só edita a si mesmo (`user.id === player.id`), enquanto treinadores e gestores administram os atletas por eles criados (`user.id === player.createdByUserId`).
  - **Fase Alvo:** Separação definitiva no banco entre tabela `User` (autenticação e tenancy) e `PlayerProfile` (dados desportivos e histórico em quadra).

---

## 7. Padrões de Infraestrutura Transversal

Padrões canônicos de implementação adotados em todo o backend:

### 7.1 Error Handling Centralizado
- **Backend:** Todas as rotas de API tratam erros exclusivamente via `handleApiError(error)` (`src/lib/api-helpers.ts`). Stack traces são ocultados em produção e respostas seguem o formato padronizado `{ error, message, details }`.
- **Classes Tipadas:** Utilizar a hierarquia canônica de `ApiError` (`src/lib/errors.ts`):
  - `ValidationError` (400)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)
- **Frontend:** Tratamento de falhas por rota via `error.tsx` e fallback global de aplicação via `global-error.tsx`.

### 7.2 Paginação por Cursor
- **Envelope de Resposta Padrão:** Todas as listagens paginadas retornam:
  ```json
  {
    "data": {
      "<entidades>": [...],
      "nextCursor": "cuid_ou_null"
    }
  }
  ```
- **Contrato de Requisição:** Query params padronizados via Zod: `cursor` (string opcional) e `limit` (número inteiro, default `20`, máximo rígido `100` para prevenção de DoS).

### 7.3 Contexto de Segurança RLS na Aplicação
- **Isolamento via `AsyncLocalStorage`:** Gerenciado por `src/lib/rls-context.ts` para evitar vazamentos de contexto assíncrono entre requisições concorrentes.
- **Helper de Execução Segura:** Utilizar `runWithRLS(user, async () => { ... })` com garantia de cleanup automático (`finally { rlsStorage.disable() }`).
- **Filtro Automático de Queries:** Utilizar `withRLSFilter(query, filterFn)` para aplicar restrições de tenant/ownership automaticamente (ex: `createdByUserId`), ignorando o filtro caso o perfil seja `ADMIN`.

### 7.4 Validação Contratual com Zod
- **Schemas Centralizados:** Localizados em `src/schemas/contracts.ts` e arquivos de domínio em `src/schemas/`.
- **Helper Canônico:** Consumo em API routes via `const body = await validatedRequest(request, Schema)` (`src/lib/api-helpers.ts`), eliminando validações manuais dispersas.

