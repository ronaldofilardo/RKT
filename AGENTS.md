# Multi-Agent Spec — rkt

## Princípios Globais (aplicáveis a TODOS os agentes)
- **SRP (Single Responsibility Principle):** cada agente atua APENAS no seu domínio. Se a demanda escapar do escopo, delega explicitamente citando `@agente-alvo`.
- **Context isolation:** cada agente carrega SOMENTE os arquivos/pastas do seu domínio. Nunca vazar contexto entre agentes.
- **Output contract:** toda resposta deve conter: (1) o que foi feito, (2) arquivos tocados, (3) handoff sugerido para outro agente.
- **No cross-cutting changes:** nenhum agente altera código fora do seu domínio sem handoff explícito.
- **Fail loud:** se faltar contexto, pare e peça. Não invente.

## Convenções de Handoff
- `@backend → @qa` quando endpoint estiver pronto para testes.
- `@frontend → @qa` quando componente/página estiver pronta para testes.
- `@arquitetura → @backend` quando ADR for aprovado.
- `@arquitetura → @frontend` quando decisão de UI/UX estrutural for necessária.
- `@qa → @backend` quando falha for detectada em API.
- `@qa → @frontend` quando falha for detectada em UI.
- `@backend → @arquitetura` quando decisão estrutural for necessária.
- `@frontend → @arquitetura` quando decisão de arquitetura de UI for necessária.

## Regra de Fronteira (Projetos em Andamento)

**Data de Corte:** 2026-07-20 (adoção do multi-agente)

- **Código NOVO** (arquivos criados após 2026-07-20) segue **100%** as specs dos agentes.
- **Código LEGADO** (arquivos existentes) só é tocado pelos agentes quando:
  1. Uma **feature nova** exige mudança nele, OU
  2. Um **bug crítico** exige correção, OU
  3. Foi explicitamente listado em `docs/REFACTOR_QUEUE.md`.

### Ao tocar código legado, o agente DEVE:

1. **Delimitar o "raio de mudança" mínimo** — não refatorar além do necessário para a tarefa.
2. **Adicionar testes de caracterização ANTES de mudar** (via `@qa`) — capturar comportamento atual.
3. **Registrar item em `docs/TECH_DEBT.md`** se identificar dívida adjacente (mas **NÃO corrigir agora** — anotar e seguir).
4. **Documentar no PR** o que foi mudado e por quê (linkar issue/ADR se aplicável).

### Exemplo de Aplicação

```
✅ Permitido:
- Criar nova API route `/api/suggestions` seguindo guardrails
- Modificar `matchService.ts` para adicionar feature de suggestion
- Adicionar teste de caracterização em `matchService.test.ts` antes de mudar

❌ Não permitido:
- Refatorar `playerService.ts` inteiro "porque precisa de limpeza"
- Mudar estrutura de `src/components/scoring/` sem feature/bug relacionado
- Corrigir TD-011 (componentes gigantes) sem haver feature passando por ali
```

**Objetivo:** Aceitar o passado, mas **não permitir que o futuro herde os pecados**.

## Stack do Projeto
- **Framework:** Next.js 15+ (App Router)
- **Linguagem:** TypeScript 5.5+
- **Database:** PostgreSQL + Prisma ORM
- **Estilização:** Tailwind CSS
- **Testes:** Jest (unitário), Playwright (E2E), Stryker (mutation)
- **Auth:** JWT via `jose`, middleware + RLS
- **PWA:** desabilitado (removido 2026-08-02 por cache stale da API em produção)

## Comandos Úteis
```bash
pnpm dev              # Desenvolvimento
pnpm build            # Build (gera Prisma + Next)
pnpm start            # Produção
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm test             # Jest (unitário)
pnpm test:watch       # Jest watch mode
pnpm test:coverage    # Jest com coverage
pnpm test:components  # Jest (componentes)
pnpm test:e2e         # Playwright
pnpm test:mutation    # Stryker
pnpm db:push          # Prisma db push
pnpm db:migrate       # Prisma migrate dev
pnpm db:seed          # Seed do banco
pnpm spec:validate    # Validação de spec drift
```

```