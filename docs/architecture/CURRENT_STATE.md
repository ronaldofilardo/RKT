# Estado Atual do Projeto — rkt

**Gerado em:** 2026-07-20  
**Por:** @arquitetura (Onda 0 — Discovery)  
**Status:** READ-ONLY

---

## 1. Estrutura de Diretórios

```
rkt/
├── .agents/                    # Definições dos agentes multi-agente
│   ├── backend.md
│   ├── frontend.md
│   ├── qa.md
│   └── arquitetura.md
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   │   └── ADR-0001-adocao-multiagente.md
│   └── architecture/           # Documentação arquitetural
│       └── CURRENT_STATE.md
├── e2e/
│   ├── flows/                  # Testes E2E (Playwright)
│   │   ├── 01-full-match-cycle.spec.ts
│   │   ├── 02-session-suspend-resume.spec.ts
│   │   ├── 02-session-resume-ui.spec.ts
│   │   └── 03-offline-sync.spec.ts
│   └── helpers/                # Utilitários E2E
├── prisma/
│   ├── schema.prisma           # Modelo de domínio
│   ├── seed.ts                 # Seed do banco
│   └── migrations/             # Migrations versionadas
├── public/
│   ├── icons/                  # Ícones PWA
│   ├── manifest.json           # Manifest PWA
│   ├── sw.js                   # Service Worker
│   └── workbox-*.js            # Workbox (cache)
├── scripts/                    # Scripts utilitários
├── specs/                      # Especificações de domínio
│   ├── api-contracts.md        # Contratos de API
│   ├── domain-glossary.md      # Glossário de domínio
│   ├── offline-sync-rules.md   # Regras de sync offline
│   └── security-matrix.md      # Matriz de segurança
├── src/
│   ├── __tests__/              # Testes unitários de alto nível
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Route Handlers (API REST)
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── clubs/
│   │   │   ├── matches/
│   │   │   └── players/
│   │   ├── match/              # Fluxo de partida
│   │   │   ├── [id]/
│   │   │   │   ├── report/
│   │   │   │   └── scoring/
│   │   │   └── new/
│   │   ├── matches/
│   │   │   └── locate/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── atletas/
│   │   ├── historico/
│   │   ├── dados-pessoais/
│   │   ├── partidasanotadas/
│   │   ├── partidasaovivo/
│   │   ├── aguardandoanotador/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home
│   │   ├── error.tsx           # Error boundary
│   │   └── global-error.tsx    # Global error boundary
│   ├── components/             # Componentes React
│   │   ├── dashboard/          # Componentes do dashboard
│   │   ├── scoring/            # Componentes de scoring
│   │   └── ui/                 # Componentes de UI genéricos
│   ├── contexts/               # React Contexts
│   ├── core/                   # Lógica de domínio pura
│   │   └── scoring/            # Scoring Engine (agnóstica)
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Utilitários e infraestrutura
│   │   ├── auth.ts             # Autenticação JWT
│   │   ├── rls-context.ts      # Row-Level Security context
│   │   └── match-events.ts     # Eventos de partida
│   ├── schemas/                # Validação com Zod
│   │   └── contracts.ts        # Tipos e contratos compartilhados
│   └── services/               # Services (lógica de negócio)
│       ├── adminService.ts
│       ├── annotationSessionService.ts
│       ├── matchService.ts
│       ├── matchRepository.ts
│       ├── matchValidator.ts
│       ├── matchSuggestionService.ts
│       ├── playerService.ts
│       └── sessionService.ts
├── tests/                      # Setup e utilitários de teste
│   └── setup.ts
├── .env                        # Variáveis de ambiente
├── .env.example                # Template de env
├── .eslintrc.json              # Config ESLint
├── jest.config.js              # Config Jest
├── jest.components.config.js   # Config Jest (componentes)
├── middleware.ts               # Next.js Middleware (auth)
├── next.config.ts              # Config Next.js
├── package.json                # Dependências e scripts
├── playwright.config.ts        # Config Playwright
├── postcss.config.js           # Config PostCSS
├── stryker.config.json         # Config Stryker (mutation)
├── tailwind.config.ts          # Config Tailwind
└── tsconfig.json               # Config TypeScript
```

**Profundidade:** 3 níveis (raiz → módulo → submódulo)  
**Total de arquivos TypeScript/TSX:** ~134 (excluindo testes)

---

## 2. Estilo Arquitetural Detectado

### Padrão Predominante: **Layered Architecture + Feature Modules**

```
┌─────────────────────────────────────────────────────┐
│                  App Router (Pages)                 │
│              (src/app/**/page.tsx)                  │
├─────────────────────────────────────────────────────┤
│              Components (UI Layer)                  │
│           (src/components/**/**/*.tsx)              │
├─────────────────────────────────────────────────────┤
│           Route Handlers (API Layer)                │
│            (src/app/api/**/route.ts)                │
├─────────────────────────────────────────────────────┤
│              Services (Business Logic)              │
│             (src/services/**/*.ts)                  │
├─────────────────────────────────────────────────────┤
│           Repositories (Data Access)                │
│          (src/services/*Repository.ts)              │
├─────────────────────────────────────────────────────┤
│         Core (Domain Logic - Pure Functions)        │
│          (src/core/scoring/**/*.ts)                 │
├─────────────────────────────────────────────────────┤
│                Prisma ORM (Persistence)             │
│              (prisma/schema.prisma)                 │
└─────────────────────────────────────────────────────┘
```

### Características Observadas

| Característica | Status | Observação |
|----------------|--------|------------|
| **Separação de camadas** | ✅ | UI → API → Service → Repository → DB |
| **Domain-Driven Design** | 🟡 | Entidades claras, mas sem Aggregates explícitos |
| **Server Components** | 🟡 | Mistura de Server/Client Components (pode melhorar) |
| **API RESTful** | ✅ | Route Handlers organizados por recurso |
| **CQRS** | ❌ | Não detectado |
| **Event Sourcing** | ❌ | Não detectado |
| **Hexagonal** | ❌ | Acoplamento direto ao Prisma |

### Classificação: **Layered Architecture com elementos de Clean Architecture**

- **Camada de Apresentação:** Pages + Components
- **Camada de Aplicação:** Services + Route Handlers
- **Camada de Domínio:** Core (scoring) + Schemas
- **Camada de Infraestrutura:** Prisma + Auth + Middleware

---

## 3. Stack Tecnológica

### Frameworks Principais

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 15.3.0+ | Framework full-stack (App Router) |
| React | 18.3.0+ | Biblioteca de UI |
| TypeScript | 5.5.0+ | Linguagem (strict mode) |
| Prisma | 5.17.0 | ORM (PostgreSQL) |
| Tailwind CSS | 3.4.0 | Estilização |
| Jest | 29.7.0 | Testes unitários |
| Playwright | 1.46.0 | Testes E2E |
| Stryker | 8.6.0 | Mutation testing |

### Bibliotecas Chave

| Biblioteca | Uso |
|------------|-----|
| `jose` | JWT (autenticação) |
| `zod` | Validação de schemas |
| `idb` | IndexedDB (offline sync) |
| `@ducanh2912/next-pwa` | PWA (service worker) |
| `bcryptjs` | Hash de senhas |

### Banco de Dados

- **Provider:** PostgreSQL
- **ORM:** Prisma
- **Migrations:** Versionadas em `prisma/migrations/`
- **Seed:** `prisma/seed.ts`

---

## 4. Domínios do Sistema (baseado em `prisma/schema.prisma`)

### Entidades Principais

```
┌──────────────────────────────────────────────────────────────┐
│                         Player                                │
│  - id, name, email, role (ATHLETE, COACH, ADMIN, etc.)       │
│  - dados pessoais: club, age, backhand, dominance, ranking   │
│  - relacionamentos: matches (P1/P2), annotation sessions     │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                          Match                                │
│  - id, format, state (SCHEDULED/IN_PROGRESS/FINISHED)        │
│  - player1Id, player2Id (FK → Player)                        │
│  - scoreState (JSON), initialServerId                        │
│  - metadados: tournament, round, court, visibility           │
│  - status: isResuming, openForAnnotation, deletedAt          │
│  - finish: winnerId, finishReason, finishNote                │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                        PointLog                               │
│  - id, matchId (FK → Match), winnerId                        │
│  - type (ACE, WINNER, FORCED_ERROR, etc.)                    │
│  - serverId, annotations (JSON), timestamp                   │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌──────────────────────────────────────────────────────────────┐
│               MatchAnnotationSession                          │
│  - id, matchId (FK → Match), annotatorUserId (FK → Player)   │
│  - startedAt, endedAt, isActive, status                      │
│  - matchStateSnapshot, finalStateSnapshot                    │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                 AnnotationEndorsement                         │
│  - id, sessionId (FK → Session), endorsedByUserId            │
│  - endorsedAt, unique(sessionId, endorsedByUserId)           │
└──────────────────────────────────────────────────────────────┘
```

### Bounded Contexts Detectados

1. **Gestão de Partidas (Match Management)**
   - Match, PointLog
   - Services: `matchService`, `matchRepository`, `matchValidator`
   - APIs: `/api/matches/**`

2. **Gestão de Jogadores (Player Management)**
   - Player
   - Services: `playerService`, `adminService`
   - APIs: `/api/players/**`, `/api/admin/users/**`

3. **Anotação Tática (Annotation)**
   - MatchAnnotationSession, AnnotationEndorsement
   - Services: `annotationSessionService`
   - APIs: `/api/matches/:id/sessions/**`

4. **Autenticação e Autorização (Auth)**
   - Player.role (RBAC)
   - Middleware, `lib/auth.ts`, `lib/rls-context.ts`
   - APIs: `/api/auth/**`

5. **Scoring Engine (Core)**
   - Lógica pura de pontuação (tênis)
   - `src/core/scoring/**`
   - Independente de UI/Backend

---

## 5. Pontos de Entrada

### Pages (UI)

| Página | Rota | Propósito |
|--------|------|-----------|
| Home | `/` | Landing page |
| Dashboard | `/dashboard` | Visão geral do usuário |
| Login | `/login` | Autenticação |
| Admin | `/admin` | Gestão administrativa |
| Atletas | `/atletas` | Listagem de jogadores |
| Histórico | `/historico` | Partidas finalizadas |
| Dados Pessoais | `/dados-pessoais` | Perfil do usuário |
| Partidas Anotadas | `/partidasanotadas` | Partidas com anotação |
| Partidas Ao Vivo | `/partidasaovivo` | Partidas em andamento |
| Aguardando Anotador | `/aguardandoanotador` | Fila de anotação |
| Nova Partida | `/match/new` | Criação de partida |
| Scoring | `/match/[id]/scoring` | Interface de pontuação |
| Relatório | `/match/[id]/report` | Relatório da partida |
| Localizar Partidas | `/matches/locate` | Busca de partidas |

### API Routes (Backend)

| Recurso | Endpoints | Auth | Roles Mínimos |
|---------|-----------|------|---------------|
| Auth | POST `/api/auth/login`, POST `/api/auth/logout` | ❌/✅ | — |
| Players | GET `/api/players`, GET/PUT/DELETE `/api/players/:id` | ✅ | SPECTATOR |
| Matches | GET/POST `/api/matches`, GET/PUT/DELETE `/api/matches/:id` | ✅ | SPECTATOR/ATHLETE |
| Match State | PATCH `/api/matches/:id/state`, POST `/api/matches/:id/point` | ✅ | ATHLETE |
| Match Finish | POST `/api/matches/:id/finish` | ✅ | ATHLETE |
| Match Report | GET `/api/matches/:id/report` | ✅ | ATHLETE |
| Annotation Sessions | GET/POST `/api/matches/:id/sessions` | ✅ | SPECTATOR/COACH |
| Session Endorse | POST `/api/matches/:id/sessions/:sessionId/endorse` | ✅ | COACH |
| Session Abandon | POST `/api/matches/:id/sessions/:sessionId/abandon` | ✅ | ANNOTATOR |
| Suspended Sessions | GET `/api/matches/suspended-sessions` | ✅ | ATHLETE |
| Tournament Suggestions | GET `/api/matches/tournament-suggestions` | ✅ | SPECTATOR |
| Admin Users | GET/POST `/api/admin/users`, GET/PUT/DELETE `/api/admin/users/:id` | ✅ | ADMIN |

### Middleware

**Arquivo:** `middleware.ts`

**Funções:**
- Verificação de token JWT em rotas protegidas
- Injeção de headers `x-user-id` e `x-user-role`
- Redirecionamento para `/login` se não autenticado
- Bypass para rotas públicas (`/api/auth/login`, `/login`, `/matches/locate`, `/`)

**Matcher:**
```typescript
matcher: [
  '/api/:path*',
  '/dashboard/:path*',
  '/admin/:path*',
  '/match/:path*',
  '/matches/:path*',
  '/historico/:path*',
  '/dados-pessoais/:path*',
  '/partidasanotadas/:path*',
  '/partidasaovivo/:path*',
  '/aguardandoanotador/:path*',
]
```

### Services (Lógica de Negócio)

| Service | Responsabilidade |
|---------|------------------|
| `adminService` | Gestão de usuários (CRUD, roles) |
| `annotationSessionService` | Sessões de anotação (criar, endossar, abandonar) |
| `matchService` | Gestão de partidas (criar, atualizar, finalizar) |
| `matchRepository` | Acesso a dados de partidas (Prisma) |
| `matchValidator` | Validação de regras de negócio (scoring, formato) |
| `matchSuggestionService` | Sugestão de partidas compatíveis |
| `playerService` | Gestão de jogadores (CRUD, stats) |
| `sessionService` | Sessões de usuário (auth, resume) |

---

## 6. Integrações Externas

### Banco de Dados

- **Tipo:** PostgreSQL
- **Conexão:** `DATABASE_URL` (env)
- **ORM:** Prisma Client
- **RLS:** Implementado via `lib/rls-context.ts` (filtros manuais)

### Autenticação

- **Provider:** JWT via `jose`
- **Secret:** `JWT_SECRET` (env)
- **Middleware:** `middleware.ts` + `lib/auth.ts`
- **RBAC:** `Role` enum (ADMIN, GESTOR, COACH, ATHLETE, SPECTATOR)

### PWA (Progressive Web App)

- **Plugin:** `@ducanh2912/next-pwa`
- **Service Worker:** `public/sw.js` + `public/workbox-*.js`
- **Manifest:** `public/manifest.json`
- **Offline Sync:** IndexedDB via `idb`
- **Estratégia:** Cache-first para estáticos, network-first para API

### Testes

- **Unitários:** Jest (`jest.config.js`)
- **Componentes:** Jest + Testing Library (`jest.components.config.js`)
- **E2E:** Playwright (`playwright.config.ts`)
- **Mutation:** Stryker (`stryker.config.json`)
- **Coverage:** JaCoCo-style (lcov)

---

## 7. Acoplamentos e Dependências

### Quem Chama Quem (Services)

```
┌─────────────────────────────────────────────────────────────┐
│                     Route Handlers                         │
│                  (src/app/api/**/route.ts)                  │
└─────────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Match   │   │  Player  │   │ Annotation│
    │ Service  │   │ Service  │   │  Service  │
    └──────────┘   └──────────┘   └──────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────────────────────────────────────┐
    │          MatchRepository                 │
    │        (Prisma Client)                   │
    └──────────────────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────────────────┐
    │           PostgreSQL Database            │
    └──────────────────────────────────────────┘
```

### Core Scoring (Independente)

```
┌─────────────────────────────────────────────────────────────┐
│                  Scoring Engine (Pure)                      │
│              (src/core/scoring/**/*.ts)                     │
│  - Processa PointFlow                                       │
│  - Calcula sets/games/pontos                                │
│  - Determina winner/finished                                │
│  - ZERO dependências externas (UI/DB)                       │
└─────────────────────────────────────────────────────────────┘
```

### Middleware → Auth

```
┌─────────────────────────────────────────────────────────────┐
│                    middleware.ts                            │
│  - Intercepta todas as rotas protegidas                     │
│  - Verifica JWT via lib/auth.ts                             │
│  - Injeta x-user-id, x-user-role                            │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                     lib/auth.ts                             │
│  - requireAuth(request, minRole)                            │
│  - getUserFromRequest(request)                              │
│  - jwtVerify(token, JWT_SECRET)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Especificações Existentes

### `specs/domain-glossary.md`
- Entidades centrais (Match, Scoring Engine, Annotation Session)
- Estados do Match (SCHEDULED → IN_PROGRESS → FINISHED | CANCELLED)
- Roles (ADMIN > GESTOR > COACH > ATHLETE > SPECTATOR)

### `specs/api-contracts.md`
- Contratos de API (endpoints, auth, roles, payloads)
- Regras de negócio (finalização, hierarquia, sessions)

### `specs/offline-sync-rules.md`
- Estratégias de sync offline
- Conflitos e resolução

### `specs/security-matrix.md`
- Matriz de autenticação/autorização
- RLS e vazamento de dados

---

## 9. Cobertura de Testes Atual

### Testes Existentes

| Tipo | Config | Localização |
|------|--------|-------------|
| Unitário (Services) | Jest | `src/services/__tests__/*.test.ts` |
| Unitário (Components) | Jest + TL | `src/**/__tests__/*.test.tsx` |
| Unitário (Hooks) | Jest + TL | `src/hooks/__tests__/*.test.ts` |
| Unitário (API Routes) | Jest | `src/app/api/**/__tests__/*.test.ts` |
| E2E | Playwright | `e2e/flows/*.spec.ts` |
| Mutation | Stryker | `stryker.config.json` |

### Fluxos E2E Cobertos

1. **01-full-match-cycle** — Criação → Scoring → Finalização
2. **02-session-suspend-resume** — Suspensão → Retomada de sessão
3. **02-session-resume-ui** — UI de retomada pós-confirmação
4. **03-offline-sync** — Sync offline quando desconectado

### Gaps Detectados (Pré-Discovery)

- [ ] Testes de integração de API (com banco real via Testcontainers)
- [ ] Testes de contrato de API (OpenAPI/Swagger)
- [ ] Testes de acessibilidade (axe-core)
- [ ] Testes de performance (Lighthouse CI)
- [ ] Testes de segurança (OWASP ZAP)

---

## 10. Próximos Passos (Onda 1)

### @arquitetura
- [ ] Criar `docs/TECH_DEBT.md` com dívidas óbvias
- [ ] Priorizar gaps de arquitetura

### @backend
- [ ] Estabelecer guardrails de API (`src/app/api/CONTRACTS.md`)
- [ ] Criar `src/lib/api-helpers.ts`
- [ ] Implementar `src/lib/rls-context.ts` (Row-Level Security)
- [ ] Criar template de Route Handler padronizado

### @frontend
- [ ] Estabelecer guardrails de UI (`src/components/TEMPLATE/`)
- [ ] Criar `src/lib/ui-helpers.ts`
- [ ] Documentar design tokens (`tailwind.config.ts`)
- [ ] Criar template de página padronizado

### @qa
- [ ] Configurar setup de testes (`tests/setup.ts`)
- [ ] Criar helpers E2E (`e2e/helpers/`)
- [ ] Criar templates de teste (API + Component)
- [ ] Gerar relatório de cobertura atual + gaps

---

## Referências

- **ADR-0001:** `docs/adr/ADR-0001-adocao-multiagente.md`
- **Agentes:** `.agents/*.md`
- **Onboarding:** `docs/AGENTS_ONBOARDING.md`
- **Multi-Agent Spec:** `AGENTS.md`