# Roadmap de Adoção Multi-Agente — rkt

**Criado em:** 2026-07-20  
**Status:** Em progresso (Onda 0 completa)

---

## 📅 Visão Geral

```
Semana 1  │ Onda 0: Discovery (READ-ONLY)
Semana 2  │ Onda 1: Guardrails + Onda 1.5: Characterization Tests
Semana 3+ │ Onda 2: Features Novas sob Regime
Semana 4+ │ Onda 3: Refactor Guiado por Dor
```

---

## ✅ Onda 0 — Discovery (Completa)

**Período:** 2026-07-20  
**Agente:** @arquitetura (READ-ONLY)  
**Status:** ✅ 100%

### Entregáveis

| Artefato | Status | Localização |
|----------|--------|-------------|
| Estrutura de diretórios | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Estilo arquitetural | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Stack tecnológica | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Domínios do sistema | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Pontos de entrada | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Integrações externas | ✅ | `docs/architecture/CURRENT_STATE.md` |
| Dívidas técnicas (27 itens) | ✅ | `docs/TECH_DEBT.md` |
| ADR de adoção | ✅ | `docs/adr/ADR-0001-adocao-multiagente.md` |
| Guia de onboarding | ✅ | `docs/AGENTS_ONBOARDING.md` |

### Descobertas Chave

- **134 arquivos** TypeScript/TSX (excluindo testes)
- **18 API routes** (endpoints)
- **71 testes** existentes (unitários + E2E)
- **3 dívidas críticas:** RLS, JWT_SECRET hardcoded, sem testes de integração
- **8 dívidas altas:** Validação, paginação, error handling, rate limiting, acessibilidade, monitoramento, env validation

---

## 🎯 Onda 1 — Guardrails (Em Andamento)

**Período:** 2026-07-20 a 2026-07-27  
**Agentes:** @backend, @frontend, @qa  
**Status:** 🟡 Em progresso

### Entregáveis Planejados

| Artefato | Owner | Status | Prioridade |
|----------|-------|--------|------------|
| `src/lib/api-helpers.ts` | @backend | ❌ Pendente | Alta |
| `src/lib/errors.ts` | @backend | ❌ Pendente | Alta |
| `src/lib/jwt.ts` (centralizar JWT_SECRET) | @backend | ❌ Pendente | Crítica |
| `src/app/api/TEMPLATE/route.ts` | @backend | ❌ Pendente | Alta |
| `src/lib/ui-helpers.ts` | @frontend | ❌ Pendente | Média |
| `src/components/TEMPLATE/` | @frontend | ❌ Pendente | Média |
| `tests/setup.ts` (atualizar) | @qa | ❌ Pendente | Alta |
| `e2e/helpers/` (factories) | @qa | ❌ Pendente | Alta |
| Template de teste de API | @qa | ❌ Pendente | Alta |
| Template de teste de componente | @qa | ❌ Pendente | Média |

### Contratos de API

| Endpoint | Auth | Validação | Paginação | Error Handler | Status |
|----------|------|-----------|-----------|---------------|--------|
| POST `/api/auth/login` | ❌ | 🟡 | N/A | 🟡 | Refatorar |
| GET `/api/players` | ✅ | N/A | ❌ | 🟡 | Refatorar |
| POST `/api/matches` | ✅ | ✅ | N/A | 🟡 | Refatorar |
| GET `/api/matches` | ✅ | N/A | ❌ | 🟡 | Refatorar |
| ... (14 endpoints) | ... | ... | ... | ... | ... |

**Legenda:** ✅ Implementado | 🟡 Parcial | ❌ Não implementado

---

## 🧪 Onda 1.5 — Characterization Tests (Próximo)

**Período:** 2026-07-27 a 2026-08-03  
**Agente:** @qa (--legacy mode)  
**Status:** ❌ Pendente

### Módulos Prioritários (Nível 1)

| Módulo | Motivo | Dívidas | Esforço |
|--------|--------|---------|---------|
| `src/services/matchService.ts` | RF-004, RF-005 | TD-003, TD-002 | M |
| `src/lib/rls-context.ts` | RF-004 | TD-003 | P |
| `src/app/api/matches/route.ts` | RF-001, RF-005 | TD-008, TD-002 | P |

### Critérios de Aceite

- [ ] ≥70% cobertura de linha no módulo
- [ ] ≥60% cobertura de branch no módulo
- [ ] Suspeitas marcadas (`// SUSPECT: TD-XXX`)
- [ ] TECH_DEBT.md atualizado
- [ ] Testes verdes (`pnpm test` passa)

---

## 🚀 Onda 2 — Features Novas sob Regime

**Período:** 2026-08-03 em diante  
**Agentes:** Todos (handoff explícito)  
**Status:** ❌ Pendente

### Primeira Feature Piloto

**Feature:** Sugestão de Partidas Compatíveis

**Fluxo:**
```
1. @arquitetura → ADR (modelo de domínio, estratégia)
2. @backend → API + service + validation (guardrails)
3. @frontend → UI + integração (guardrails)
4. @qa → testes unitários + integração + E2E
```

**Critérios de Sucesso:**
- ✅ Segue todos os guardrails estabelecidos
- ✅ Cobertura ≥80% no módulo novo
- ✅ Zero dívidas técnicas introduzidas
- ✅ Handoffs explícitos documentados

---

## ♻️ Onda 3 — Refactor Guiado por Dor

**Período:** 2026-08-10 em diante  
**Agentes:** @arquitetura → @backend → @qa  
**Status:** ❌ Pendente

### Refatorações Prioritárias (REFACTOR_QUEUE.md)

| ID | Refatoração | Gatilho | Esforço | Owner |
|----|-------------|---------|---------|-------|
| RF-001 | Normalizar JWT_SECRET | Próxima API com JWT | P | @backend |
| RF-002 | Extrair EditScoreModal | Feature scoring | M | @frontend |
| RF-003 | Extrair PointDetailsModal | Feature scoring | M | @frontend |
| RF-004 | RLS Centralizado | Próxima query com filtro | M | @backend |
| RF-005 | Validação Zod em todas APIs | Próxima API nova/modificada | M | @backend |
| RF-006 | Paginação em list endpoints | Feature com listagem longa | P | @backend |
| RF-007 | Isolar Scoring Engine | Modificação no scoring | M | @backend |
| RF-008 | Error Handling Centralizado | Próxima API | M | @backend |

### Regra de Ouro

**Nenhum refactor sem:**
1. ✅ Characterization tests verdes (Onda 1.5)
2. ✅ Justificativa de negócio (feature ou bug crítico)
3. ✅ Handoff explícito (@arquitetura → @backend → @qa)

---

## 📊 Métricas de Sucesso

### Semana 2 (Guardrails)

| Métrica | Meta | Atual |
|---------|------|-------|
| Helpers de API implementados | 3 | 0 |
| Templates criados | 4 | 0 |
| Endpoints refatorados | 3 críticos | 0 |

### Semana 3 (Characterization)

| Métrica | Meta | Atual |
|---------|------|-------|
| Módulos com characterization | 3 críticos | 0 |
| Cobertura média | ≥70% | — |
| Suspeitas mapeadas | Todas | 0 |

### Semana 4+ (Features + Refactor)

| Métrica | Meta | Atual |
|---------|------|-------|
| Features sob regime | 100% | 0% |
| Dívidas críticas resolvidas | 3 | 0 |
| Dívidas altas resolvidas | 5 | 0 |

---

## 🛑 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Big Bang refactor | Baixa | Alto | Regra de fronteira + REFACTOR_QUEUE |
| Agente toca em tudo | Média | Médio | Modo legado explícito nos agents |
| Cobertura como meta global | Baixa | Médio | Foco em cobertura do módulo tocado |
| Time não adota | Média | Alto | Features piloto demonstram valor |
| Guardrails ignorados | Alta | Alto | CI checks + code review |

---

## 📝 Próximos Passos Imediatos

### Esta Semana (Onda 1 — Guardrails)

**@backend:**
```markdown
/backend

## Tarefa: Implementar Guardrails de API

1. Criar `src/lib/api-helpers.ts` (jsonResponse, validatedRequest, handleApiError)
2. Criar `src/lib/errors.ts` (ApiError, ValidationError, etc.)
3. Criar `src/lib/jwt.ts` (getJWTSecret centralizado)
4. Criar template `src/app/api/TEMPLATE/route.ts`
5. Refatorar `/api/auth/login` seguindo guardrails

Handoff: → @qa (testes de contrato)
```

**@frontend:**
```markdown
/frontend

## Tarefa: Implementar Guardrails de UI

1. Criar `src/lib/ui-helpers.ts` (cn, formatDate, formatCurrency)
2. Documentar design tokens em `tailwind.config.ts`
3. Criar componente TEMPLATE
4. Criar página TEMPLATE

Handoff: → @qa (testes de acessibilidade)
```

**@qa:**
```markdown
/qa

## Tarefa: Implementar Guardrails de Testes

1. Atualizar `tests/setup.ts` (mocks, cleanup)
2. Criar `e2e/helpers/` (factories, auth)
3. Criar template de teste de API
4. Criar template de teste de componente

Handoff: → @backend (characterization tests)
```

---

## Referências

- `AGENTS.md` — Multi-agent spec + Regra de fronteira
- `.agents/*.md` — Definições dos agentes (com modos legado)
- `docs/AGENTS_ONBOARDING.md` — Guia de adoção incremental
- `docs/CHARACTERIZATION_TESTS.md` — Guia de characterization tests
- `docs/REFACTOR_QUEUE.md` — Fila de refatoração priorizada
- `docs/TECH_DEBT.md` — Dívidas técnicas (27 itens)
- `docs/architecture/CURRENT_STATE.md` — Estado atual do projeto