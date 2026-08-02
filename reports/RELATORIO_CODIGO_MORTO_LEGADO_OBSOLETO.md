# Relatório — Código Morto, Legado e Obsoleto

**Projeto:** rkt  
**Data:** 2026-07-31  
**Escopo:** `src/` (265 arquivos `.ts`/`.tsx`)  
**Metodologia:** Busca por patterns (DEPRECATED, SUSPECT, TODO, FIXME, console.log, alert(), template files, stub pages, barrel exports obsoletos, imports não utilizados), análise de `docs/TECH_DEBT.md`, `docs/REFACTOR_QUEUE.md`, `AGENTS.md`.

---

## 1. RESUMO EXECUTIVO

| Categoria | Contagem | Status | Impacto |
|-----------|----------|--------|---------|
| **Arquivo DEPRECATED** (barrel obsoleto) | 1 | � Ativo mas marcado | Baixo (compatibilidade) |
| **Template oficial** (não usado em produção) | 1 | 🟢 Intencional | Nenhum (referência) |
| **Stub / Página truncada** | 1 | 🔴 Impactante (19 testes falham) | Alto |
| **Artefatos de debug (console.info + alert)** | 3 blocos | 🔴 Ativo em produção | Alto (UX degradada) |
| **Console.log residual** (referenciado em docs) | 100+ ocorrências | � Documentado | Médio |
| **Tests com markers SUSPECT/TD-XXX** | 27 ocorrências (3 arquivos) | 🟡 Em dívida técnica | Médio |
| **Tests falhando (Dashboard)** | 19 (6 + 13) | 🔴 Backlog | Alto |
| **Imports expostos a migração** | 1 (`rankingConstants`) | � Em transição | Baixo |

---

## 2. CÓDIGO MORTO / OBSOLETO — DETALHADO

### 2.1 [DEPRECATED] Barrel de ranking — `src/app/match/new/rankingConstants.ts`

- **Local:** `src/app/match/new/rankingConstants.ts` (12 linhas)
- **Status:** `DEPRECATED` explicitamente anotado no arquivo.
- **Problema:** Re-exporta `@/lib/ranking/rankingConstants` para preservar compatibilidade de imports antigos (`@/app/match/new/rankingConstants`).
- **Risco se ignorado:** Nenhum funcional, mas acumula dívida técnica e confusão para novos devs.
- **Ação sugerida:** Remover após confirmar que nenhum arquivo ainda importa deste path (auditoria de grep necessária).
- **Referência:** Linha 9: `DEPRECATED: prefira importar diretamente de `@/lib/ranking/rankingConstants`.`

---

### 2.2 [STUB] DashboardPage incompleto — `src/app/dashboard/page.tsx`

- **Local:** `src/app/dashboard/page.tsx`
- **Status indicado em `docs/TECH_DEBT.md` (TD-046):** A página foi reduzida a 7 linhas (stub mínimo) no commit `1511b97` (`feat: replace home redirect with landing page, add dashboard page and make it public for E2E tests`).
- **Estado atual verificado (2026-07-31):** O arquivo possui **468 linhas** e contém código funcional (não é mais um stub vazio). No entanto, há **artefatos de debug** inseridos diretamente no componente.
- **Artefatos de debug identificados no arquivo:**
  1. **Linhas 278-289:** `console.info(...)` + `alert(...)` no handler do botão hamburger.
  2. **Linhas 320-333:** `console.info(...)` + `console.error(...)` no handler de nova partida.
  3. **Linhas 403-413:** `console.info(...)` + `alert(...)` no handler de clique nos itens do menu.
- **Problema:** `alert()` bloqueia a thread do navegador e `console.info` expõe dados internos. Em produção, isso degrada a UX e pode quebrar testes E2E.
- **Referência em `docs/TECH_DEBT.md`:** TD-046 — 19 testes falhando (6 em `DashboardAnnotatedView` + 13 em `HamburgerMenu`) porque os testes foram escritos antes da mudança de landing page.
- **Ação sugerida:**
  - Remover todos os blocos `console.info` + `alert` (linhas 278-289, 320-333, 403-413).
  - Reescrever `dashboard/page.tsx` para usar os hooks `useDashboardData`, `useDashboardNavigation`, etc., conforme proposta (Opção A do TD-046) ou marcar testes como `.skip` (Opção C) até resolver.

---

### 2.3 [LEGACY] Template de rota de API — `src/app/api/_TEMPLATE/route.ts`

- **Local:** `src/app/api/_TEMPLATE/route.ts` (111 linhas)
- **Status:** Template oficial (não morto, mas legado de referência).
- **Problema:** Todo o conteúdo é comentado (`// const data = ...`, `// const body = ...`) exceto os retornos `501 NOT_IMPLEMENTED`. Não é importado por nenhum arquivo de produção (não faz parte do bundle).
- **Risco:** Nenhum funcional. Pode ser removido ou movido para `docs/templates/` se não for mais usado como referência ativa.
- **Referência:** `AGENTS.md` menciona que código legado só é tocado quando uma feature nova exige mudança nele.

---

### 2.4 [LEGACY] Template de componente — `src/components/README_TEMPLATES.md`

- **Local:** `src/components/README_TEMPLATES.md`
- **Status:** Documento de referência com código comentado (`// const response = await fetch(...)`).
- **Problema:** Nenhum código executável, apenas documentação com snippets incompletos. Não representa código morto, mas documenta padrões que podem estar desatualizados.
- **Ação sugerida:** Verificar se o template ainda corresponde ao padrão atual (`next.config.ts`, `prisma/schema.prisma`).

---

### 2.5 [DEAD CODE — COMENTADO] Código comentado em testes de scoring

- **Local:** `src/components/scoring/__tests__/EditScoreModal.bugfix.test.ts`
- **Problema:** Linhas 14-19 e 25 contêm blocos de código comentados (`// const existingCompleted...`, `// const finalSets...`, `// const completedSets...`).
- **Risco:** Nenhum funcional, mas aumenta confusão quando se lê o arquivo de testes. Pode ser removido ou convertido em comentários explicativos.

---

### 2.6 [DEAD CODE — COMENTADO] Código comentado em caracterização de `matchService`

- **Local:** `src/services/__tests__/matchService.characterization.test.ts`
- **Problema:** Linha 570 contém `// construção real (que precisa de scoreState válido), mockamos por`. Não é código morto, mas indica uma limitação documentada no código.
- **Ação sugerida:** Nenhuma ação imediata necessária além de manter o contexto.

---

## 3. ARTEFATOS DE DEBUG EMBUTIDOS EM PRODUÇÃO

### 3.1 `console.info` + `alert()` no Dashboard (`page.tsx`)

| Linha | Conteúdo | Tipo | Impacto |
|-------|----------|------|---------|
| 278-289 | `console.info(...)` + `alert(...)` ao clicar no menu hamburger | Debug / UX breaker | � Alto |
| 320-333 | `console.info(...)` + `console.error(...)` ao criar nova partida | Debug | 🟡 Médio |
| 403-413 | `console.info(...)` + `alert(...)` ao clicar item de menu | Debug / UX breaker | 🔴 Alto |

- **Problema:** `alert()` interrompe a execução assíncrona e pode quebrar testes E2E (Playwright) que esperam interações suaves. `console.info` polui logs de produção.
- **Referência:** Nenhuma menção a esses artefatos em `docs/TECH_DEBT.md`, sugerindo que foram introduzidos recentemente (possivelmente no commit que restaurou o dashboard).
- **Ação sugerida:** Remover imediatamente os blocos de `console.info` + `alert` e `console.info` + `console.error`. Se for necessário para debugging, usar `logger.info` (já importado no componente) e nunca `alert()`.

---

## 4. CÓDIGO LEGADO / EM MIGRAÇÃO

### 4.1 Import path legado para ranking constants

- **Local:** `src/app/match/new/rankingConstants.ts` (re-export) → `src/lib/ranking/rankingConstants.ts` (canônico)
- **Status:** Em transição. Nenhum arquivo no projeto ainda importa diretamente de `@/lib/ranking/rankingConstants`? (requer grep para confirmar).
- **Ação sugerida:** Executar `grep -r "@/lib/ranking/rankingConstants" src/` para confirmar adoção completa antes de remover o barrel.

---

### 4.2 Componentes refatorados — arquivos extraídos permanecem

Conforme `docs/REFACTOR_QUEUE.md`:

| Arquivo original | Status | Arquivos criados | Risco |
|------------------|--------|------------------|-------|
| `useScoringHandlers.ts` (577 L) | Refatorado (~300 L) | `useScoringHandlers.*.service.ts` | Baixo |
| `useSessionManager.ts` (469 L) | Refatorado (~200 L) | `useSessionManager.*` | Baixo |
| `atletas/page.tsx` (590 L) | Refatorado (~240 L) | `EditAthleteModal.tsx`, `RankingForm.tsx` | Baixo |
| `EditScoreModal.tsx` (531 L) | Refatorado (~170 L) | `useEditScoreModal.ts` | Baixo |
| `match/new/page.tsx` (574 L) | Refatorado (~530 L) | `types.ts` | Baixo |

- **Observação:** Nenhum arquivo original foi removido, apenas reduzido. Não há duplicação de lógica funcional, apenas extração saudável.
- **Referência:** `docs/REFACTOR_QUEUE.md`: "Não há duplicação real. A separação de responsabilidades está correta."

---

## 5. TESTES — CÓDIGO MORTO / FALHANDO / MARCADO

### 5.1 Caracterização de testes com markers `SUSPECT` / `TD-XXX`

- **Arquivos afetados:**
  - `src/services/__tests__/matchService.characterization.test.ts`: 8 ocorrências (`SUSPECT: TD-XXX`)
  - `src/services/__tests__/annotationSessionService.characterization.test.ts`: 9 ocorrências + 1 `.skip`
  - `src/services/__tests__/matchValidator.characterization.test.ts`: 6 ocorrências

- **Problema:** Os testes documentam comportamentos suspeitos mas não corrigem a causa raiz. Alguns testes são `.skip` (linha 416), indicando que a funcionalidade não está testada.
- **Status em `docs/TECH_DEBT.md`:** TD-028 (auto-add de sets), TD-029 (mock fragmentado), TD-030 (testes de UI inválidos) — todos resolvidos ou em progresso.
- **Ação sugerida:** Remover os `.skip` após corrigir a causa raiz, ou converter os `SUSPECT` em tickets formais com resolução documentada.

---

### 5.2 Tests falhando no Dashboard (`docs/TECH_DEBT.md` — TD-046)

- **Contagem:** 19 testes falhando
  - `DashboardAnnotatedView.test.tsx`: 6 testes
  - `HamburgerMenu.test.tsx`: 13 testes
- **Causa raiz:** Commit `1511b97` mudou `dashboard/page.tsx` de 448 linhas para 7 linhas (stub). Os testes esperam elementos que não existem mais no componente atual (ex: header com `<h2>Partidas Anotadas</h2>`, lista de `MatchCard` com `data-testid`, botão "Voltar para Início").
- **Estado atual:** A página foi restaurada a 468 linhas, mas ainda contém os artefatos de debug mencionados acima. Os testes podem continuar falhando se não forem atualizados para refletir a nova estrutura.
- **Ação sugerida:**
  1. Atualizar `DashboardAnnotatedView.test.tsx` e `HamburgerMenu.test.tsx` para corresponder ao componente atual (se a restauração for definitiva).
  2. Ou, se a restauração for temporária, marcar os testes como `.skip` com referência ao TD-046.

---

### 5.3 Tests de `EditScoreModal` (resolvidos — referência)

- **Status:** `docs/TECH_DEBT.md` indica que todos os 61 testes de `EditScoreModal` estão passando após resolução do TD-028 e TD-030.
- **Referência:** "Todas as 7 suites de EditScoreModal agora passam (61/61 testes). Zero falhas no projeto inteiro (99/99 suites, 1200 testes passando)."
- **Nota:** Se o relatório atual (2026-07-31) ainda mostra falhas, pode haver regressão entre a data do TECH_DEBT.md (atualizado até 2026-07-28) e a data do código atual.

---

## 6. DÍVIDA TÉCNICA DOCUMENTADA — CÓDIGO AINDA NÃO RESOLVIDO

Conforme `docs/TECH_DEBT.md`:

| Ticket | Impacto | Módulo afetado | Status |
|--------|---------|---------------|--------|
| TD-001 | Alto | `src/app/api/**`, `src/services/**` | 🟡 Parcialmente resolvido |
| TD-002 | Alto | `src/app/api/**` | 🟡 Parcialmente resolvido |
| TD-003 | Crítico | `src/lib/rls-context.ts`, `src/services/**Repository.ts` | 🟡 Em progresso |
| TD-004 | Alto | Endpoints sem paginação | 🟡 Parcialmente resolvido |
| TD-005 | Médio | `src/app/**`, `src/components/**` | 🟡 Em progresso |
| TD-007 | Médio | `src/core/scoring/**` | 🟡 Em progresso |
| TD-008 | Crítico | `src/app/api/matches/route.ts` (JWT_SECRET) | ✅ Resolvido (2026-07-28) |
| TD-009 | Alto | Rate limiting | 🟡 Em progresso |
| TD-011 | Médio | Componentes gigantes | 🟡 Em progresso (55 violações jsx-a11y) |
| TD-012 | Baixo | Documentação de componentes | 🟡 Em progresso |
| TD-013 | Médio | E2E frágil | 🟡 Em progresso |
| TD-014 | Alto | Acessibilidade | 🟡 Em progresso |
| TD-015 | Baixo | Mutation testing | 🟡 Em progresso (Sprint 2) |
| TD-016 | Médio | NFRs | 🟡 Em progresso |
| TD-017 | Alto | Monitoramento | 🟡 Em progresso |
| TD-018 | Médio | Rollback migrations | 🟡 Em progresso |
| TD-019 | Baixo | OpenAPI | � Em progresso |
| TD-020 | Baixo | Dependências desatualizadas | � Em progresso |
| TD-021 | Médio | Cleanup de dados de teste | 🟡 Em progresso |
| TD-022 | Alto | Validação de env | 🟡 Em progresso |
| TD-023 | Médio | Health checks | 🟡 Em progresso |
| TD-024 | Baixo | i18n de erros | 🟡 Em progresso |
| TD-025 | Médio | Performance budgets | 🟡 Em progresso |
| TD-026 | Médio | Duplicação de validação | 🟡 Em progresso |
| TD-027 | Baixo | Feature flags | 🟡 Em progresso |
| TD-032 | Médio | Redo não exposto na UI | 🟡 Em progresso |

**Observação:** Muitos desses tickets não representam "código morto", mas sim dívida técnica estrutural. Eles são relevantes para o contexto de código legado e obsoleto porque alguns podem exigir a remoção ou substituição de módulos inteiros.

---

## 7. PADRÕES OBSOLETOS / EM MIGRAÇÃO ENCONTRADOS

### 7.1 Console.log / console.info / console.error residuais

- **Referência:** `docs/REFACTOR_QUEUE.md` menciona 100+ ocorrências de `console.log` nos arquivos:
  - `src/hooks/useSessionManager.ts`: 18+ ocorrências
  - `src/hooks/useScoringHandlers.ts`: 12+ ocorrências
  - `src/components/scoring/EditScoreModal.tsx`: múltiplos
  - API routes: extensivo
- **Status:** `logger.ts` foi criado (`src/lib/logger.ts`) como serviço padronizado, mas a migração não está completa.
- **Ação sugerida:** Substituir todos os `console.log` por `logger.info/debug` e remover aqueles que são apenas resíduos de desenvolvimento.

---

### 7.2 Magic Numbers (sem constante nomeada)

- **Local:** `EditScoreModal.tsx` (timeout 1000ms), `useScoringHandlers.ts` (timeout 15000ms, debounce 50ms), `editScoreHelpers.ts` (constantes de jogos embutidas).
- **Referência:** `docs/REFACTOR_QUEUE.md` item 17.
- **Status:** Não corrigido.
- **Ação sugerida:** Extrair para `src/lib/constants.ts` (já existente — verificar conteúdo).

---

### 7.3 Nomes de variáveis confusos (legado)

- **Problema:** `ctx`, `state`, `match` usados com múltiplos significados.
- **Referência:** `docs/REFACTOR_QUEUE.md` item 14.
- **Status:** Não corrigido.
- **Ação sugerida:** Refatoração gradual em próximas sprints, conforme política de fronteira.

---

## 8. INVENTÁRIO DE ARQUIVOS COM POTENCIAL DE REMOÇÃO

| Arquivo | Motivo | Verificação necessária | Prioridade |
|---------|--------|----------------------|------------|
| `src/app/match/new/rankingConstants.ts` | DEPRECATED barrel | `grep -r "@/app/match/new/rankingConstants" src/` | Baixa |
| `src/app/api/_TEMPLATE/route.ts` | Template de referência | Confirmar que não é importado por nenhum arquivo | Baixa |
| `src/components/README_TEMPLATES.md` | Template de referência | Confirmar uso ativo | Baixa |
| Blocos `console.info` + `alert()` em `dashboard/page.tsx` | Debug artifacts | Nenhuma — podem ser removidos imediatamente | Alta |
| Comentários `.skip` em testes de caracterização | Dívida técnica documentada | Resolver TD correspondente | Média |
| `console.log` residuais (100+) | Migração para `logger.ts` incompleta | Auditoria completa | Média |

---

## 9. RECOMENDAÇÕES IMEDIATAS (P0 — Ação Hoje)

1. **Remover artefatos de debug (`console.info` + `alert`) de `src/app/dashboard/page.tsx`** — 3 blocos identificados (linhas 278-289, 320-333, 403-413). Isso é código que nunca deveria estar em produção e pode quebrar testes E2E.
2. **Auditar import de `rankingConstants`** para confirmar se o barrel `src/app/match/new/rankingConstants.ts` pode ser removido.
3. **Atualizar `DashboardAnnotatedView.test.tsx` e `HamburgerMenu.test.tsx`** conforme TD-046, ou marcar como `.skip` se a restauração não for definitiva.
4. **Remover comentários `.skip`** após resolver os tickets correspondentes, para não mascarar falhas.

---

## 10. RECOMENDAÇÕES DE CURTO PRAZO (P1 — Próxima Sprint)

1. **Completar migração de `console.log` para `logger.ts`** (referenciado em `docs/REFACTOR_QUEUE.md`).
2. **Remover ou arquivar `src/app/api/_TEMPLATE/route.ts`** se não for usado ativamente como base para novas rotas.
3. **Resolver `SUSPECT` markers em testes de caracterização** (`matchService`, `annotationSessionService`, `matchValidator`) — cada um pode representar um bug real.
4. **Confirmar se `dashboard/page.tsx` está no estado final** (restaurado) ou se ainda é um stub parcial. Se for o estado final, atualizar todos os testes relacionados.

---

## 11. REFERÊNCIAS

- `docs/TECH_DEBT.md` (937 linhas, atualizado até 2026-07-28)
- `docs/REFACTOR_QUEUE.md` (446 linhas, atualizado até 2026-07-20)
- `AGENTS.md` (política de fronteira, multi-agente)
- `src/app/dashboard/page.tsx` (468 linhas — contém artefatos de debug)
- `src/app/match/new/rankingConstants.ts` (12 linhas — DEPRECATED)
- `src/app/api/_TEMPLATE/route.ts` (111 linhas — template)
- `src/components/scoring/__tests__/EditScoreModal.bugfix.test.ts` (código comentado)
- `src/services/__tests__/matchService.characterization.test.ts` (SUSPECT markers)
- `src/services/__tests__/annotationSessionService.characterization.test.ts` (SUSPECT + `.skip`)
- `src/services/__tests__/matchValidator.characterization.test.ts` (SUSPECT markers)
- `src/app/match/new/page.tsx`, `src/app/atletas/page.tsx`, `src/components/scoring/EditScoreModal.tsx` (refatorados — nenhum arquivo morto identificado)

---

*Relatório gerado automaticamente por análise estática do código + inspeção de arquivos-chave.*  
*Recomendação: revisar este relatório com `@arquitetura` e `@qa` para priorizar ações na próxima sprint.*
