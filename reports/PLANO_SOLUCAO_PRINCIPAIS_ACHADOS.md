# Plano de Solução — Principais Achados

**Base:** `reports/RELATORIO_CODIGO_MORTO_LEGADO_OBSOLETO.md`  
**Data:** 2026-07-31  
**Responsável de acompanhamento:** `@arquitetura` + `@qa`

---

## Estrutura do Plano

| Prioridade | Item | Arquivo / Ticket | Esforço | Owner sugerido | Dependências |
|------------|------|------------------|---------|----------------|--------------|
| P0 | Remover `console.info` + `alert()` (3 blocos) | `src/app/dashboard/page.tsx` | P | `@frontend` | Nenhuma |
| P0 | Confirmar remoção do barrel `rankingConstants` | `src/app/match/new/rankingConstants.ts` | P | `@frontend` | `grep` de imports |
| P1 | Resolver falha dos 19 testes do Dashboard | `src/app/dashboard/__tests__/*` (TD-046) | M | `@frontend` → `@qa` | P0 concluído |
| P1 | Resolver `SUSPECT` markers (27 ocorrências) | `src/services/__tests__/*` (3 arquivos) | M | `@backend` → `@qa` | Nenhuma |
| P1 | Completar migração `console.log` → `logger.ts` | Diversos (`useScoringHandlers`, `useSessionManager`, `EditScoreModal`) | M | `@backend` + `@frontend` | Nenhuma |

---

## P0 — Ações Imediatas (Hoje / Próximas 24h)

### P0-1: Remover artefatos de debug do Dashboard

**Problema:** `src/app/dashboard/page.tsx` contém 3 blocos com `console.info(...)` e `alert(...)` embutidos diretamente nos handlers de interação. Isso quebra a UX e pode interferir em testes E2E (Playwright).

**Localização exata:**
- Bloco A (hamburger): linhas 278-289
- Bloco B (nova partida): linhas 320-333
- Bloco C (menu item click): linhas 403-413

**Ação:**
1. Remover `console.info(...)` + `alert(...)` dos blocos A e C.
2. Remover `console.info(...)` + `console.error(...)` do bloco B.
3. Se for necessário manter algum log para debugging, usar `logger.info(...)` (já importado no componente, linha 8) e **nunca** usar `alert()` em produção.

**Verificação após alteração:**
```bash
pnpm lint
pnpm test:components -- --testPathPattern="DashboardAnnotatedView|HamburgerMenu"
```

**Handoff:** Nenhum — é uma remoção direta de código. Se o `dashboard/page.tsx` ainda estiver em estado provisório (restaurado mas não finalizado), documentar no PR que a remoção dos artefatos é independente do estado final do componente.

---

### P0-2: Confirmar e remover barrel `rankingConstants`

**Problema:** `src/app/match/new/rankingConstants.ts` é um barrel DEPRECATED que re-exporta `@/lib/ranking/rankingConstants`.

**Ação:**
1. Executar grep para confirmar que nenhum arquivo ainda importa deste path:
```bash
grep -r "@/app/match/new/rankingConstants" src/
```
2. Se o resultado for vazio (ou apenas o próprio arquivo), remover `src/app/match/new/rankingConstants.ts`.
3. Se houver imports restantes, criar ticket separado para migração desses imports para `@/lib/ranking/rankingConstants` antes de remover o arquivo.

**Verificação após alteração:**
```bash
pnpm typecheck
pnpm build
```

**Handoff:** Se houver imports restantes, `@frontend` migra → `@arquitetura` aprova remoção.

---

## P1 — Curto Prazo (Próxima Sprint ou Sprint +1)

### P1-1: Resolver falha dos 19 testes do Dashboard (TD-046)

**Problema:** `DashboardAnnotatedView.test.tsx` (6 falhas) e `HamburgerMenu.test.tsx` (13 falhas) foram escritos antes do commit `1511b97`. A página atual (`dashboard/page.tsx`) possui 468 linhas e contém elementos que os testes não esperam (ou vice-versa).

**Opções documentadas no `docs/TECH_DEBT.md`:**
- **Opção A (recomendada):** Reescrever `dashboard/page.tsx` usando os hooks existentes (`useDashboardData`, `useDashboardNavigation`, `useDashboardData`) e componentes (`MatchCard`, `HamburgerMenu`, `DeleteMatchModal`, `FinishMatchModal`). Esforço: M (1-2 sprints).
- **Opção B (rápida):** Marcar testes como `.skip` com referência ao TD-046. Esforço: P.
- **Opção C (híbrida — recomendada para esta sprint):** Aplicar B agora (marcar `.skip`) e abrir ticket para A (restauração definitiva).

**Plano sugerido (Opção C):**

**Passo 1 (Sprint atual):**
- Marcar os 19 testes como `.skip` em `DashboardAnnotatedView.test.tsx` e `HamburgerMenu.test.tsx`.
- Adicionar comentário explicativo em cada `.skip` referenciando `docs/TECH_DEBT.md` — TD-046 e o commit `1511b97`.

**Passo 2 (Sprint +1):**
- Confirmar se `dashboard/page.tsx` está no estado final (restaurado a 468 linhas e funcional) ou se ainda é provisório.
- Se for definitivo: atualizar os testes para refletir a nova estrutura (header, `MatchCard`, menu, etc.).
- Se não for definitivo: manter `.skip` até a conclusão do refactor do dashboard.

**Verificação após alteração:**
```bash
pnpm test:components -- --testPathPattern="Dashboard"
```

**Handoff:** `@frontend` decide entre A/B/C → `@qa` implementa `.skip` ou atualiza testes → `@arquitetura` valida se a restauração está completa.

---

### P1-2: Resolver `SUSPECT` markers nos testes de caracterização

**Problema:** 3 arquivos de teste de caracterização contêm 27 ocorrências de `SUSPECT: TD-XXX`. Alguns desses testes documentam bugs reais que ainda não foram corrigidos na camada de serviço/API.

**Arquivos e contagem:**
- `src/services/__tests__/matchService.characterization.test.ts`: 8 `SUSPECT`
- `src/services/__tests__/annotationSessionService.characterization.test.ts`: 9 `SUSPECT` + 1 `.skip`
- `src/services/__tests__/matchValidator.characterization.test.ts`: 6 `SUSPECT`

**Plano por arquivo:**

**`matchService.characterization.test.ts`:**
- Os `SUSPECT` referem-se a: `createMatch` não valida `player1 !== player2` (resolvido — TD-033), `updateMatch` aceita qualquer campo (resolvido — TD-034), `deleteMatch` soft delete não limpa dados (resolvido — TD-035), `updateMatch` permite transição `SCHEDULED → FINISHED` (resolvido — TD-036).
- **Ação:** Se todos os tickets correspondentes estão resolvidos (como indica `docs/TECH_DEBT.md`), os `SUSPECT` devem ser removidos dos testes. Se algum ainda persiste, verificar se o fix está no código de produção.

**`annotationSessionService.characterization.test.ts`:**
- Os `SUSPECT` referem-se a: uso de `sessionStorage` direto, `markSessionAbandoned` ignora erros silenciosamente (resolvido — TD-038, TD-039), falta de validação de inputs (parcialmente resolvido — TD-037).
- **Ação:** Remover `.skip` (linha 416) após confirmar que o fix de `markSessionAbandoned` e `validateId()` estão aplicados no código de produção (`src/services/annotationSessionApi.ts`).

**`matchValidator.characterization.test.ts`:**
- Os `SUSPECT` referem-se a validação de transições de estado (`SCHEDULED → FINISHED`) e detecção de tiebreak.
- **Ação:** Confirmar se `validateTransitionState` e `validateFinishMatch` estão atualizados (`src/services/matchValidator.ts`). Se sim, remover `SUSPECT`.

**Verificação após alteração:**
```bash
pnpm test -- --testPathPattern="characterization"
```

**Handoff:** `@backend` confirma resolução dos tickets correspondentes (`TD-033` a `TD-045`) → `@qa` remove `SUSPECT` e `.skip` → `@arquitetura` valida que não há regressão.

---

### P1-3: Completar migração `console.log` → `logger.ts`

**Problema:** `docs/REFACTOR_QUEUE.md` documenta 100+ ocorrências residuais de `console.log` / `console.info` em arquivos de produção. `logger.ts` (`src/lib/logger.ts`) já existe como serviço padronizado, mas a migração não está completa.

**Arquivos principais (referenciados no `docs/REFACTOR_QUEUE.md`):**
- `src/hooks/useSessionManager.ts`: 18+ ocorrências
- `src/hooks/useScoringHandlers.ts`: 12+ ocorrências
- `src/components/scoring/EditScoreModal.tsx`: múltiplos
- API routes: extensivo

**Plano sugerido (abordagem incremental):**

**Sprint atual (P1 — foco em arquivos críticos):**
1. `useSessionManager.ts`: Substituir todos os `console.log` por `logger.info` ou `logger.debug`. Remover aqueles que são resíduos de desenvolvimento sem valor de produção.
2. `useScoringHandlers.ts`: Mesma abordagem.
3. `EditScoreModal.tsx`: Mesma abordagem.

**Sprint +1 (P2 — limpeza completa):**
4. Auditar todas as API routes (`src/app/api/**`) para `console.log` residuais.
5. Remover todos os logs de debug que não são necessários em produção (usar `logger.debug` para aqueles que são úteis apenas em `development`).

**Verificação após alteração:**
```bash
pnpm lint
pnpm typecheck
grep -r "console\.log\|console\.info" src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Nota:** Se o objetivo é ter zero `console.log` em produção, o comando `grep` deve retornar 0 após a migração completa. Se alguns `console.info` são intencionais, documentar no `AGENTS.md` quais são permitidos.

**Handoff:** `@backend` migra `useSessionManager.ts` e `useScoringHandlers.ts` → `@frontend` migra `EditScoreModal.tsx` e componentes → `@arquitetura` valida política de logging.

---

## Dependências entre Itens

```
P0-1 (remover alert/debug dashboard)
  └─> Não bloqueia outros, mas deve ser feito antes de qualquer teste de E2E

P0-2 (rankingConstants)
  └─> Independente, mas libera confusão para novos devs

P1-1 (Dashboard tests — TD-046)
  └─> Depende de P0-1 (artefatos removidos) para não quebrar testes que interagem com o componente
  └─> Se P0-1 não estiver concluído, o `.skip` ainda pode ser aplicado sem problema

P1-2 (SUSPECT markers)
  └─> Independente — pode ser feito em paralelo com P1-1
  └─> Requer que `@backend` confirme que os tickets `TD-033` a `TD-045` estão aplicados

P1-3 (console.log → logger)
  └─> Independente — pode ser feito em paralelo com todos os outros
  └─> Se o objetivo é ter zero `console.log` no projeto, deve ser concluído antes do próximo release
```

---

## Métricas de Sucesso

| Métrica | Antes | Meta | Quando verificar |
|---------|-------|------|-----------------|
| Blocos `console.info` + `alert()` em `dashboard/page.tsx` | 3 | 0 | Após P0-1 |
| Arquivo `rankingConstants.ts` (DEPRECATED) | 1 ativo | 0 (se sem imports) | Após P0-2 |
| Testes falhando Dashboard | 19 | 0 (ou `.skip` documentado) | Após P1-1 |
| `SUSPECT` markers em testes de caracterização | 27 | 0 (se bugs resolvidos) | Após P1-2 |
| Ocorrências `console.log` residuais | 100+ | 0 | Após P1-3 |

---

## Notas para o Agente / Equipe

- **Não introduzir nova dívida:** Qualquer alteração neste plano deve seguir a `Política de Fronteira` (`AGENTS.md`): código legado só é tocado quando uma feature/bug exige, e testes de caracterização devem ser adicionados antes de mudanças em código legado.
- **Documentar no PR:** Cada PR que implementar parte deste plano deve referenciar o item correspondente (`P0-1`, `P1-2`, etc.) e, se tocar código legado, documentar o raio de mudança mínimo.
- **Fail loud:** Se algum `grep` ou teste não retornar o esperado (ex: `rankingConstants` ainda tem imports, `SUSPECT` ainda é válido porque o bug persiste), parar e documentar no `docs/TECH_DEBT.md` ao invés de ocultar.
