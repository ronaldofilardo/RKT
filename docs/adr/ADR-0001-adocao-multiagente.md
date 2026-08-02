# ADR-0001: Adoção de Sistema Multi-Agente para Vibecoding

**Status:** Accepted  
**Data:** 2026-07-20  
**Owner:** @arquitetura

---

## Contexto

O projeto rkt é uma aplicação Next.js 15+ para gestão de partidas de tênis, com:
- Autenticação JWT via `jose`
- Banco PostgreSQL + Prisma ORM
- PWA com offline sync
- Testes (Jest, Playwright, Stryker)

**Problema:** À medida que o projeto cresce, manter consistência arquitetural, qualidade de código e cobertura de testes torna-se cada vez mais desafiador. Decisões são tomadas de forma descentralizada, gerando inconsistências e dívida técnica acumulada.

**Forças em jogo:**
- Necessidade de velocidade (entregar features)
- Necessidade de qualidade (código sustentável)
- Contexto limitado por agente (LLM)
- Risco de decisões contraditórias

---

## Decisão

Adotar sistema multi-agente especializado com **SRP rigoroso** e **handoffs explícitos**, seguindo o padrão Strangler Fig para adoção incremental.

### Agentes

| Agente | Domínio | Responsabilidades |
|--------|---------|-------------------|
| `@arquitetura` | Estrutura, ADRs, NFRs | Decisões macro, dívida técnica, boundaries |
| `@backend` | APIs, Prisma, Auth | Route handlers, services, validation, security |
| `@frontend` | UI, React, Tailwind | Pages, components, hooks, accessibility |
| `@qa` | Testes, DoD, CI | Unit, integration, E2E, mutation testing |

### Princípios

1. **Context Isolation:** cada agente carrega SOMENTE arquivos do seu domínio
2. **Handoff Explícito:** nenhum agente toca código fora do seu escopo sem handoff
3. **Output Contract:** toda resposta contém (1) feito, (2) arquivos, (3) próximo handoff
4. **Fail Loud:** se faltar contexto, pare e peça. Não invente.

---

## Consequências

### Positivas
- ✅ Decisões arquiteturais documentadas (ADRs)
- ✅ Contexto focado por agente (menos alucinação)
- ✅ Handoffs explícitos rastreáveis
- ✅ Dívida técnica mapeada e priorizada
- ✅ Qualidade consistente (guardrails)

### Negativas
- ⚠️ Overhead de comunicação (handoffs)
- ⚠️ Necessidade de disciplina para seguir protocolo
- ⚠️ Risco de "jogar código por cima do muro" se não houver critérios claros

### Neutras
- ➖ Documentação adicional (ADRs, TECH_DEBT.md, CURRENT_STATE.md)
- ➖ Estrutura de pastas expandida (`.agents/`, `docs/adr/`, `docs/architecture/`)

---

## Alternativas Consideradas

### A. Agente Único "Full-Stack"
**Prós:** Simplicidade, menos overhead  
**Contras:** Contexto diluído, decisões inconsistentes, qualidade variável  
**Descartada porque:** Não escala para projetos complexos

### B. Dois Agentes (Backend + Frontend)
**Prós:** Divisão clara, menos handoffs  
**Contras:** QA e arquitetura ficam órfãos, decisões estruturais sem dono  
**Descartada porque:** Qualidade e arquitetura são críticas para sustentabilidade

### C. Sistema Multi-Agente com 4 Especialistas (Escolhida)
**Prós:** SRP rigoroso, qualidade por domínio, rastreabilidade  
**Contras:** Mais handoffs, requer disciplina  
**Selecionada porque:** Balanceia especialização com coordenação explícita

---

## Fitness Functions (Mensuráveis)

| NFR | Meta | Como Medir |
|-----|------|------------|
| Cobertura de testes | ≥ 80% linha, ≥ 70% branch | `pnpm test:coverage` |
| Mutation score | ≥ 60% | `pnpm test:mutation` |
| Type safety | 0 erros TypeScript | `pnpm typecheck` |
| Lint | 0 erros ESLint | `pnpm lint` |
| ADRs atualizados | Toda decisão macro tem ADR | `docs/adr/**/*.md` |
| Dívida técnica mapeada | TECH_DEBT.md atualizado | `docs/TECH_DEBT.md` |

---

## Handoffs

- **→ @backend:** Estabelecer guardrails de API (Onda 1)
- **→ @frontend:** Estabelecer guardrails de UI (Onda 1)
- **→ @qa:** Estabelecer infraestrutura de testes (Onda 1)
- **→ @arquitetura:** Gerar CURRENT_STATE.md (Onda 0)

---

## Referências

- `AGENTS.md` — Especificação dos agentes
- `.agents/` — Definições por agente
- `docs/AGENTS_ONBOARDING.md` — Guia de adoção incremental
- **Test de caracterização:** [ADR‑0001‑test → docs/adr/__tests__/ADR-0001-adocao-multiagente.test.ts]