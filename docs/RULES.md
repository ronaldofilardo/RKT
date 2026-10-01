# RULES — RKT (Racket App)

> Diretrizes de código do sistema. **Este é um dos 6 arquivos-canônico** (ver `AGENTS.md`).
> **Data da análise:** 2026-10-01 · **Commit:** `c53ae98`

---

## 1. Princípios Gerais Identificados no Código

1. **Separação por responsabilidade (SRP)**
   - `src/core/` = regra pura sem I/O (`engine.ts`, `report/*`).
   - `src/services/` = orquestração de negócio + persistência.
   - `src/hooks/` = estado/orquestração de UI.
   - `src/lib/` = infraestrutura transversal (auth, RLS, logger, erros, offline).
   - `src/schemas/` = contratos de dados (Zod) isolados da implementação.

2. **Núcleo agnóstico e testável** — o `ScoringEngine` não importa React, Next nem Prisma; é o único alvo de mutation testing (`stryker.config.json`).

3. **Fail loud com erro tipado** — `ApiError` + `handleApiError` (`src/lib/errors.ts`, `src/lib/api-helpers.ts`, usados em 21 pontos) centralizam a resposta de erro das APIs.

4. **Idempotência e auditabilidade** — `PointLog.clientEventId` e `sequenceNumber` são únicos por partida; `voidedAt` registra ponto anulado; `MatchScoreEdit` guarda snapshots antes/depois.

5. **Segurança por padrão** — 22 das 25 rotas passam por `withRLSHandler` (fora: `auth/login`, `auth/logout`, `matches/tournament-suggestions`); headers de segurança globais; middleware limpa headers forjados.

6. **Acessibilidade como requisito** — `jsx-a11y` com regras `error` + testes E2E com `expectNoAxeViolations`.

7. **Characterization-First** — nenhum refactor de legado sem testes `*.characterization.test.ts` verdes primeiro (seção 7).

8. **Anti-regressão de design** — `pnpm test:design` valida o Telemetry Design System; classe genérica de Tailwind (`bg-gray-*`, `bg-sky-*`, `bg-emerald-*`) é proibida em páginas-chave.

9. **Baby steps e código mais limpo** — mudanças pequenas, testadas a cada passo; "deixe o código mais limpo do que encontrou"; refatoração que não melhorar deve ser revertida.

---

## 2. Padrões de Tipagem (TypeScript)

`tsconfig.json`:

| Opção | Valor | Efeito |
|---|---|---|
| `strict` | `true` | Checagem estrita |
| `noUnusedLocals` | `true` | Sem variáveis mortas |
| `noUnusedParameters` | `true` | Sem parâmetros mortos |
| `noEmit` | `true` | Checagem apenas (`pnpm typecheck`) |
| `isolatedModules` | `true` | Compatibilidade com transpilação por arquivo |
| `moduleResolution` | `bundler` | Resolução moderna |
| `jsx` | `preserve` | Deixa o Next controlar o JSX |
| Paths | `@/*` → `./src/*` | Imports absolutos obrigatórios na prática |

Excluídos do typecheck: `prisma`, `scripts`, `e2e`, `tests`, `**/__tests__`, `*.test.*`, `*.spec.*`.

Comando: `pnpm typecheck`.

---

## 3. Linting (ESLint) — `.eslintrc.json`

- **Base:** `next/core-web-vitals` + `plugin:jsx-a11y/recommended`.
- **Plugin ativo:** `jsx-a11y`.

**Regras em nível `error`:** `alt-text`, `anchor-has-content`, `anchor-is-valid`, `aria-activedescendant-has-tabindex`, `aria-role`, `aria-props`, `heading-has-content`, `html-has-lang`, `interactive-supports-focus`, `role-has-required-aria-props`, `role-supports-aria-props`, `tabindex-no-positive`.

**Regras em nível `warn`:** `click-events-have-key-events`, `control-has-associated-label`, `label-has-associated-control`, `no-autofocus`, `no-noninteractive-element-interactions`, `no-noninteractive-element-to-interactive-role`, `no-noninteractive-tabindex`, `no-redundant-roles`, `no-static-element-interactions`.

Comando: `pnpm lint` (`next lint`). O build **não ignora** lint (`eslint.ignoreDuringBuilds: false`).

---

## 4. Formatação

- **Não há Prettier** — nenhum `.prettierrc*` nem `prettier.config.*` no repositório. O formate é o padrão do ESLint/Next.
- **Husky + lint-staged** estão declarados no `package.json` (`pre-commit: lint-staged` → `node scripts/validate-characterization.js`), **porém o diretório `.husky/` não existe** — o hook provavelmente não está ativo. *(Itens de dívida: verificar ativação.)*

---

## 5. Qualidade e Testes

| Ferramenta | Configuração | Comando |
|---|---|---|
| **Jest** (unitário/integração) | `jest.config.js` — env `node`, roots `src/`, setup `tests/setup.ts` | `pnpm test` |
| **Cobertura mínima** | statements **65%**, branches **80%**, functions **60%**, lines **65%** | `pnpm test:coverage` |
| **Testes de design** | `design-pattern.characterization`, `dual-theme.characterization`, `telemetry-integrity` | `pnpm test:design` |
| **Testes de componente** | `jest.components.config.js` — ambiente **jsdom** | `pnpm test:components` |
| **E2E** | `playwright.config.ts` — 1 worker, retries 2 em CI, axe-core | `pnpm test:e2e` |
| **Mutation** | `stryker.config.json` — `engine.ts`, `scoring-logic.ts`, `types.ts`; high 80 / low 60 / break 50 | `pnpm test:mutation` |
| **Testes pulados proibidos** | `scripts/check-no-skipped-tests.mjs` | dentro de `test:strict` |
| **Spec drift** | `scripts/validate-spec-drift.mjs` | `pnpm spec:validate` |
| **Setup de ambiente de teste** | cria/recria `racket_mvp_test` | `pnpm test:setup` |

**Suíte estrita (validação obrigatória):** `pnpm test:strict` = `typecheck` + no-skip-check + Jest em modo CI e **serializado** (`--runInBand`).

**Ambientes de teste:** API/domínio rodam em ambiente **node**; componentes em **jsdom**. O banco de CI é PostgreSQL isolado por job; falhas de instalação, geração do Prisma, schema, typecheck, skips, testes ou cobertura **interrompem a pipeline**.

**Isolamento de recursos obrigatório:** todo teste que altera timers, spies, armazenamento, listeners, IndexedDB, EventSource ou BroadcastChannel **deve restaurar o recurso no próprio escopo**. O setup global restaura spies automaticamente, mas **não substitui** a responsabilidade do teste de fechar conexões e remover listeners criados manualmente.

**Estrutura de testes:** colocados em `__tests__/` ao lado do código (`*.test.ts[x]`), com sufixo `.characterization.test.ts` para caracterização e `.regression.test.ts` para regressões.

---

## 6. CI (`.github/workflows/quality.yml`)

Roda em `push` e `pull_request` (Node 22, pnpm 9, PostgreSQL 16 como service):

```
pnpm install --frozen-lockfile --ignore-scripts
→ prisma generate → prisma db push --skip-generate
→ pnpm typecheck
→ node scripts/check-no-skipped-tests.mjs
→ pnpm test:strict
→ pnpm test:coverage
```

---

## 7. Política "Characterization-First"

**Regra de ouro:** nenhum refactor no legado sem characterization tests verdes primeiro.

Characterization tests **não testam se o código está certo** — testam **o que o código faz** (comportamento observado), mesmo que tenha bugs.

| Situação | Ação |
|---|---|
| Vai refatorar módulo legado? | ✅ Characterization tests ANTES |
| Vai adicionar feature em módulo existente? | ✅ Characterization tests ANTES |
| Módulo tem bug crítico em produção? | ✅ Characterization tests do bug primeiro |
| Só quer "limpar" código sem mudar comportamento? | ✅ Characterization tests OBRIGATÓRIO |

**Processo (5 passos):**
1. **Mapear comportamentos observados** — ler o código, logs de produção, bugs reportados, testes existentes.
2. **Escrever testes "dumb"** — capturar o que o código **faz**, não o que deveria fazer.
3. **Marcar suspeitas** — comportamentos estranhos viram item em `TASKS.md` (Anexo A — dívida técnica) como `[TD-XXX]`, sem corrigir agora.
4. **Medir cobertura** — `pnpm test:coverage`.
5. **Handoff** — `@qa → @backend` com os resultados.

**Naming:** `*.characterization.test.ts[x]`, em `__tests__/` junto ao código-alvo.

**Enforcement (inativo):** `scripts/validate-characterization.js`, via `lint-staged`, rejeita commits que tocam arquivos listados em `TASKS.md` (Anexos A/B) sem um `*.characterization.test.ts` no mesmo commit. Hoje **não roda** porque `.husky/` não existe (seção 4). Bypass explícito, só para trabalho experimental: `git commit --no-verify`.

---

## 8. Política de Refatoração

**Limites:**

| Métrica | Limite | Ação ao estourar |
|---|---|---|
| Linhas por arquivo | **≤ 500** | avaliar divisão a partir de 400+ |
| Linhas por função/método | **≤ 30** (ideal ≤ 15) | extrair função |
| Complexidade ciclomática | **≤ 10** | simplificar lógica |
| Cobertura de código | ≥ 80% (alvo) — piso real do Jest: 65/80/60/65 (seção 5) | — |

**Gatilhos para refatorar:** código duplicado em 2+ lugares → extrair; nomenclatura ambígua → renomear; comentário explicando "o quê faz" → substituir por código expressivo; dependência circular → refatorar arquitetura.

**Estratégias de divisão:** `*.service.ts` (negócio) · `*.repository.ts` (dados) · `*.validator.ts` · `*.types.ts` · `*.constants.ts` · `*.utils.ts` · `*.mappers.ts` · subcomponentes de UI.

**Checklist antes de refatorar:**
```
[ ] Testes existentes passando
[ ] Escopo da refatoração definido
[ ] Plano de etapas documentado
[ ] Backups versionados (git)
[ ] CI/CD monitorando
[ ] Revisor/peer identificado
```

**Fluxo:** `IDENTIFICAR → MEDIR → TESTAR → REFATORAR → VERIFICAR → COMITAR` (mensagem `refactor: [o quê]`).

**Anti-patterns proibidos:** God Class · Shotgun Surgery · Divergent Change · Spaghetti Code · Magic Numbers · Deep Nesting (>3 níveis → early returns/extrair métodos).

**Critérios de PR com refatoração:** sem aumento de complexidade acidental · ≤ 500 linhas/arquivo · ≤ 30 linhas/função · nenhum novo code smell · cobertura mantida ou aumentada · revisão de 1 peer.

---

## 9. Política de Ambientes e Variáveis

| Ambiente | Arquivo `.env` | Banco | Propósito |
|---|---|---|---|
| `local` | `.env.local` | `racket_mvp` | Desenvolvimento diário |
| `test` | `.env.test` | `racket_mvp_test` | Unit/E2E/Mutation |
| `production` | `.env.production` | Neon (cloud) | Produção |

**Regras:**
- `.env` (defaults, commiteado, **sem segredos**) · `.env.local`, `.env.test`, `.env.production` → **nunca commitar** (gitignored).
- **Proibido:** apontar scripts de dev para `racket_mvp_test`; usar dados de produção em teste.
- **Permitido:** `pnpm test:setup` antes da primeira execução; fixtures no banco de teste.
- Testes carregam `.env.test` via `dotenv-cli` + `NODE_ENV=test`; o `Prisma Client` lê `DATABASE_URL` do ambiente carregado.

**Scripts de teste:** `pnpm test:setup` (prepara ambiente) · `pnpm db:test:create` (recria banco) · `pnpm db:test:push` (schema) · `pnpm db:test:seed` (dados).

**Variáveis obrigatórias:** `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, `DATABASE_URL` (ver `.env.example`).

**Troubleshooting:** *"Database does not exist"* → `pnpm test:setup` · *"Connection refused"* → verificar PostgreSQL · *"Permission denied"* → recriar `racket_mvp_test` e `pnpm db:test:push`.

---

## 10. Convenções de Projeto

- **Package manager:** exclusivamente `pnpm` (ou `npx`); **`npm` proibido**.
- **Design system:** somente tokens `telemetry-*`; proibido reintroduzir `bg-gray-*`/`text-gray-*`/`border-gray-*`/`bg-sky-*`/`bg-emerald-*` em `/scoring`, `/dashboard`, `/match/new`, `/atletas` (detalhes em `DESIGN.md` §6).
- **Fronteira de código:** código novo (após 2026-07-20) segue 100% as specs; código legado só é tocado por feature/bug crítico/item de `TASKS.md` (Anexo B — fila de refatoração), com raio mínimo de mudança, teste de caracterização antes (seção 7) e documentação no PR.
- **Handoffs explícitos** entre agentes (`@backend → @qa`, etc.); **fail loud** — sem contexto, parar e pedir.
- **Context isolation** — carregar somente os arquivos do próprio domínio.
- **Única fonte de diretrizes:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/DESIGN.md`, `docs/TASKS.md`, `docs/MEMORY.md`. Qualquer outro documento de processo é histórico, não vigente.

---

## 11. Padrões de Código Observados (idioma)

- **Inglês** para identificadores, arquivos e mensagens de erro de API (`UNAUTHORIZED`, `SEQUENCE_CONFLICT`).
- **Português** para UI, comentários de domínio e mensagens voltadas ao usuário.
- Nomes de página/rota em português (`/partidasanotadas`, `/aguardandoanotador`).
- Módulos de serviço/helper fragmentados por responsabilidade: `matchService.create.helpers.ts`, `useScoringHandlers.point-sync.ts`, `dashboard.resume.helpers.ts`.
- Export nomeado para componentes (`export function DashboardViewRouter`), default export apenas para pages.
- `'use client'` explícito em páginas com estado/efeitos.

---

## 12. Comandos do Projeto

```bash
pnpm dev              # Desenvolvimento (127.0.0.1:3000)
pnpm build            # Build (prisma generate + next build)
pnpm start            # Produção
pnpm lint             # ESLint
pnpm typecheck        # TypeScript (tsc --noEmit)
pnpm spec:validate    # Validação de spec drift
pnpm test             # Jest (CI serializado)
pnpm test:strict      # typecheck + no-skips + Jest serializado
pnpm test:watch       # Jest watch
pnpm test:coverage    # Jest com coverage
pnpm test:components  # Jest (componentes, jsdom)
pnpm test:design      # Anti-regressão Telemetry Design System
pnpm test:e2e         # Playwright
pnpm test:mutation    # Stryker
pnpm test:setup       # Prepara ambiente de teste
pnpm db:push          # Prisma db push
pnpm db:migrate       # Prisma migrate dev
pnpm db:seed          # Seed do banco
pnpm db:test:create   # Recria banco de teste
pnpm db:test:push     # Schema no banco de teste
pnpm db:test:seed     # Seed do banco de teste
```

---

## 13. Regras de API e Infraestrutura Transversal

1. **Validação Obrigatória com Zod:**
   - Proibido implementar validações manuais de body/query com condicionais soltas.
   - Toda entrada de API deve ser validada via schemas centralizados (`src/schemas/`) consumidos por `await validatedRequest(request, Schema)` (`src/lib/api-helpers.ts`).

2. **Tratamento de Exceções Padronizado:**
   - Toda rota de API (`route.ts`) deve capturar erros em bloco `try/catch` e delegar a resposta a `return handleApiError(error)`.
   - Lance instâncias da hierarquia `ApiError` (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`). Nunca lance strings puras.

3. **Paginação Estrita em Listagens:**
   - Proibido criar endpoints de listagem que retornem coleções completas sem limites.
   - Endpoints de listagem devem aceitar query params `cursor` e `limit` (validado com teto máximo de 100).
   - O retorno deve sempre seguir o envelope `{ data: { [items]: [...], nextCursor: string | null } }`.

4. **Isolamento de Segurança e RLS:**
   - Rotas autenticadas devem utilizar `withRLSHandler` ou `withPermissionHandler`.
   - Operações em services que acessem o banco de dados sob tenant devem utilizar `runWithRLS(user, fn)` ou `withRLSFilter`.

