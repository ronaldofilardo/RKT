# Onda 0 — Discovery (Bootstrap)

## Estratégia: Adoção Incremental (Strangler Pattern)

Não tente rodar os 3 agentes em tudo de uma vez. Você vai afogar o contexto e gerar refactor desnecessário. Adote em **ondas**.

```
Onda 0 → Discovery (mapeia o terreno)
Onda 1 → Guardrails (impede a coisa piorar)
Onda 2 → Novo código sob os agentes
Onda 3 → Refactor guiado por dor real
```

---

## 🔍 Onda 0 — Discovery (rode UMA VEZ, no início)

Antes de qualquer agente atuar, gere o **retrato atual** do projeto.

### Prompt de Bootstrap

```markdown
Você é @arquitetura em modo READ-ONLY. Sua tarefa é gerar:

1. `docs/architecture/CURRENT_STATE.md` contendo:
   - Estrutura de pacotes (árvore, profundidade 3)
   - Estilo arquitetural detectado (layered? hexagonal? big ball of mud?)
   - Frameworks e versões
   - Módulos e seus acoplamentos (quem chama quem)
   - Pontos de entrada (controllers, listeners, schedulers)
   - Integrações externas (DBs, filas, APIs)

2. `docs/TECH_DEBT.md` inicial com dívidas ÓBVIAS:
   - Deprecated APIs em uso
   - Ausência de testes em módulos críticos
   - Violações claras de camada
   - Secrets hardcoded
   - Endpoints sem autenticação

3. `docs/adr/ADR-0001-adocao-multiagente.md` registrando
   a decisão de adotar o sistema multi-agente a partir de HOJE.

NÃO altere nenhum código. NÃO proponha refactor ainda.
```

---

## 📋 Comandos por Agente

### @arquitetura — Discovery

```markdown
/arquitetura

## Tarefa: Discovery do Projeto rkt

Gere os seguintes artefatos em **docs/architecture/**:

### 1. CURRENT_STATE.md
- [ ] Estrutura de diretórios (árvore, profundidade 3)
- [ ] Estilo arquitetural detectado
- [ ] Stack tecnológica (frameworks, versões)
- [ ] Domínios do sistema (baseado em `prisma/schema.prisma`)
- [ ] Pontos de entrada (API routes, pages, middleware)
- [ ] Integrações externas (PostgreSQL, PWA, auth)

### 2. DOMAIN_GLOSSARY.md (atualizar `specs/domain-glossary.md` se existir)
- [ ] Entidades principais (Player, Match, PointLog, etc.)
- [ ] Value Objects (MatchFormat, MatchState, PointType, etc.)
- [ ] Aggregate Roots
- [ ] Bounded Contexts detectados

### 3. TECH_DEBT.md (inicial)
Liste dívidas técnicas ÓBVIAS detectadas em uma leitura superficial:
- [ ] Ausência de testes em módulos críticos
- [ ] Violações de camada evidentes
- [ ] Code smells (arquivos gigantes, duplicação)
- [ ] Falta de validação em endpoints
- [ ] Secrets ou configs hardcoded

### 4. ADR-0001-adocao-multiagente.md
Registre a decisão de adotar o sistema multi-agente:
- Contexto: projeto existente em evolução
- Decisão: adotar agentes especializados por domínio
- Consequências: handoffs explícitos, contexto isolado

**Regras:**
- MODO READ-ONLY: NÃO altere código fonte
- Use `glob`, `grep`, `read` para explorar
- Saída: apenas arquivos de documentação
```

---

### @backend — Guardrails de API

```markdown
/backend

## Tarefa: Estabelecer Guardrails de API

Após o @arquitetura gerar o CURRENT_STATE.md, estabeleça padrões:

### 1. src/app/api/CONTRACTS.md
Defina o contrato padrão para TODAS as API routes:
- [ ] Estrutura de request/response
- [ ] Validação com Zod (schemas compartilhados em `src/schemas/`)
- [ ] Handler de erros centralizado
- [ ] Estrutura de resposta (sucesso, erro, paginação)

### 2. src/lib/api-helpers.ts
Crie utilitários para padronizar:
- [ ] `jsonResponse(data, status)` — resposta JSON padronizada
- [ ] `validatedRequest(schema, request)` — validação com Zod
- [ ] `requireAuth(request, minRole?)` — autenticação + autorização
- [ ] `paginate(data, page, limit)` — paginação padrão

### 3. src/lib/rls-context.ts (Row-Level Security)
Implemente contexto de usuário para filtragem de dados:
- [ ] `setRLSUser(user)` — seta contexto
- [ ] `getRLSUser()` — recupera contexto
- [ ] `withRLS(queryFn)` — executa query com filtro automático

### 4. Exemplo de Route Handler Padronizado
Crie `src/app/api/TEMPLATE/route.ts` como referência para todos os devs.

**Handoff:** → @qa (criar testes de contrato para as routes existentes)
```

---

### @frontend — Guardrails de UI

```markdown
/frontend

## Tarefa: Estabelecer Guardrails de UI

Após o @arquitetura gerar o CURRENT_STATE.md, estabeleça padrões:

### 1. src/components/TEMPLATE/
Crie um componente modelo seguindo:
- [ ] Server Component por padrão
- [ ] "use client" apenas quando necessário
- [ ] Props tipadas com interfaces em `src/schemas/contracts.ts`
- [ ] Tratamento de erro + loading states
- [ ] Acessibilidade (ARIA, keyboard nav)

### 2. src/lib/ui-helpers.ts
Utilitários para padronizar:
- [ ] `cn(...classes)` — classnames utility (clsx + tailwind-merge)
- [ ] `formatDate(date, locale)` — formatação padrão
- [ ] `formatCurrency(value)` — formatação de moeda
- [ ] Error boundaries e fallbacks

### 3. tailwind.config.ts — Design Tokens
Documente e padronize:
- [ ] Paleta de cores (primary, secondary, error, success)
- [ ] Tipografia (fontes, tamanhos, pesos)
- [ ] Spacing scale
- [ ] Breakpoints

### 4. src/app/TEMPLATE/page.tsx
Crie um template de página com:
- [ ] Layout padrão
- [ ] Loading state
- [ ] Error state
- [ ] Metadata (SEO)

**Handoff:** → @qa (criar testes de acessibilidade e visuais)
```

---

### @qa — Guardrails de Testes

```markdown
/qa

## Tarefa: Estabelecer Guardrails de Testes

Após @backend e @frontend estabelecerem padrões, crie a infraestrutura de testes:

### 1. tests/setup.ts (Jest)
Configure:
- [ ] Matchers customizados (toBeAuthenticated, toHaveAccess)
- [ ] Mocks globais (next/navigation, next/image)
- [ ] Cleanup após cada teste

### 2. e2e/helpers/ (Playwright)
Crie helpers para:
- [ ] `authenticate(page, role)` — login com role específica
- [ ] `createTestMatch(data)` — factory de partidas
- [ ] `createTestPlayer(data)` — factory de jogadores
- [ ] Cleanup de dados após testes E2E

### 3. src/app/api/**/__tests__/route.test.ts (TEMPLATE)
Template de teste para API routes:
- [ ] Caminho feliz (200/201)
- [ ] Erros de validação (400)
- [ ] Erros de autenticação (401)
- [ ] Erros de autorização (403)
- [ ] Recursos não encontrados (404)

### 4. src/components/**/__tests__/Component.test.tsx (TEMPLATE)
Template de teste para componentes:
- [ ] Renderização básica
- [ ] Interações do usuário
- [ ] Estados de loading/error
- [ ] Acessibilidade (axe-core)

### 5. .github/workflows/ci.yml
Garanta que o CI rode:
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test` (Jest)
- [ ] `pnpm test:components`
- [ ] `pnpm test:e2e` (Playwright)
- [ ] `pnpm test:mutation` (Stryker)

**Output:** Relatório de cobertura atual + gaps críticos
```

---

## 🚀 Onda 1 — Novo Código Sob os Agentes

Quando uma **nova feature** for solicitada:

```
1. @arquitetura → ADR (se decisão estrutural) ou domain model
2. @backend → API + service + validation
3. @frontend → UI + integração com API
4. @qa → testes unitários + integração + E2E
```

### Exemplo: Nova feature "Sugestão de Partidas"

```markdown
# Para @arquitetura
/arquitetura

## Nova Feature: Sugestão de Partidas

Contexto: Usuários querem encontrar partidas disponíveis para participar.

### Tarefa:
1. Definir modelo de domínio (Suggestion, MatchingCriteria)
2. Decidir estratégia (polling? push? event-driven?)
3. Criar ADR se necessário
4. Handoff → @backend
```

```markdown
# Para @backend (após ADR aprovado)
/backend

## Implementar: Sugestão de Partidas

### Baseado em: docs/adr/ADR-XXXX-sugestao-partidas.md

### Tarefas:
1. Prisma schema (Suggestion model)
2. API: POST /api/suggestions (criar sugestão)
3. API: GET /api/suggestions (listar disponíveis)
4. Service: matchSuggestionService.ts (lógica de matching)
5. Validação: schemas em src/schemas/

### Critérios de Aceite:
- [ ] Usuário autenticado pode criar sugestão
- [ ] Sistema sugere partidas compatíveis
- [ ] Rate limiting: máx 10 sugestões/hora
- [ ] Paginação: 20 itens por página

### Handoff: → @qa (testes de integração + E2E)
```

```markdown
# Para @frontend (após backend pronto)
/frontend

## Implementar: UI de Sugestão de Partidas

### API: /api/suggestions (GET, POST)

### Tarefas:
1. Page: /sugestoes (listar sugestões)
2. Component: SuggestionCard
3. Component: CreateSuggestionModal
4. Integração: SWR ou React Query para polling
5. Offline: cache de sugestões via IndexedDB

### Critérios de Aceite:
- [ ] Lista carrega em < 2s
- [ ] Pull-to-refresh funciona
- [ ] Offline mostra cache + indicator
- [ ] Acessível (keyboard, screen reader)

### Handoff: → @qa (testes de componente + E2E visual)
```

---

## 🛠️ Onda 2 — Refactor Guiado por Dor Real

Só refactor quando:
- ✅ Teste falhando expõe fragilidade
- ✅ Feature nova exige mudança estrutural
- ✅ Performance abaixo do SLO
- ✅ Security vulnerability detectada

### Exemplo: Refactor de Autenticação

```markdown
# Para @arquitetura
/arquitetura

## Dor: Autenticação Frágil

Problema: múltiplos pontos de falha no auth, RLS não propagado corretamente.

### Tarefa:
1. Mapear fluxos de auth atuais (middleware, API, RLS)
2. Identificar gaps (endpoints sem auth, RLS bypass)
3. Propor estratégia unificada
4. Criar ADR com migration plan

### Handoff: → @backend (implementar)
```

---

## 📊 Comandos Úteis para o Dia a Dia

### Check de Saúde do Projeto

```markdown
/arquitetura

## Health Check

Analise o estado atual do projeto:

1. Violou algum guardrail estabelecido?
2. Novos pontos de dívida técnica?
3. Handoffs estão sendo seguidos?
4. Context isolation está sendo respeitado?

Output: Relatório semanal de saúde (sem refactor, apenas diagnóstico)
```

### Antes de Merge

```markdown
/qa

## Pre-Merge Checklist

Para a feature [nome da feature]:

- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] E2E crítico passando
- [ ] Cobertura ≥ 80% no módulo
- [ ] Mutation score ≥ 60%
- [ ] Sem warnings de TypeScript
- [ ] Sem erros de ESLint

Output: ✅ Aprovado ou ❌ Bloqueado (com lista de blockers)
```

---

## 🎯 Resumo da Estratégia

| Onda | Objetivo | Agentes | Duração |
|------|----------|---------|---------|
| 0 | Discovery | @arquitetura | 1-2 dias |
| 1 | Guardrails | @backend, @frontend, @qa | 3-5 dias |
| 2 | Features novas | Todos (handoff) | Contínuo |
| 3 | Refactor sob demanda | Todos (handoff) | Sob demanda |

**Regra de Ouro:** Nunca pule ondas. Guardrails antes de features.