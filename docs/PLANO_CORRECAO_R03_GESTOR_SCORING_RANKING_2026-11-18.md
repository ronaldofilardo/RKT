# Plano de Correção: 13 Violações Pré-Existentes R-03 (Gestor, Scoring, Ranking)

**Data:** 18 de novembro de 2026  
**Metodologia:** Elephant-Goldfish Model (Google EGM)  
**Objetivo:** Eliminar as 13 violações de R-03 (> 100 linhas) sem breaking changes, mantendo 100% dos testes e tipagens verdes.

---

## 1. 🐘 The Elephant — Mapeamento & Estratégia de Refatoração

| # | Arquivo Atual | Linhas | Nova Estrutura Proposta | Limite Alvo |
|---|---|:---:|---|:---:|
| 1 | `src/app/gestor/dashboard.tsx` | 102L | Extrair modais (`CadastrarMembroModal`, `EditAthleteModal`, `IndicarAnotadorModal`, `EditMatchInfoModal`) para `gestor-dashboard-modals.tsx` (~45L). | ~65L |
| 2 | `src/app/gestor/club-matches-table.tsx` | 179L | Extrair sub-tabs de navegação para `club-matches-sub-tabs.tsx` (~55L) e painel da aba 'Meu clube' para `club-matches-my-club-panel.tsx` (~65L). | ~60L |
| 3 | `src/app/gestor/club-match-row.tsx` | 167L | Extrair célula de confronto/jogadores para `club-match-players-cell.tsx` (~45L) e célula de botões de ação para `club-match-actions-cell.tsx` (~70L). | ~65L |
| 4 | `src/app/gestor/external-scheduled-match-row.tsx` | 122L | Extrair célula de confronto externo para `external-match-confronto-cell.tsx` (~45L). | ~75L |
| 5 | `src/app/gestor/indicar-anotador-modal.tsx` | 173L | Extrair lista de seleção de treinadores para `indicar-anotador-coach-list.tsx` (~50L) e hook de submissão para `use-indicar-anotador.ts` (~55L). | ~70L |
| 6 | `src/app/api/gestor/matches/[id]/assign/route.ts` | 145L | Extrair transação Prisma e auditoria para `match-assign.logic.ts` (~75L). | ~60L |
| 7 | `src/app/api/gestor/matches/gestor-external-matches.logic.ts` | 107L | Extrair objeto de `select` Prisma para `gestor-external-matches-select.ts` (~50L). | ~55L |
| 8 | `src/components/scoring/ScoringHeader.tsx` | 103L | Extrair metadados (formato, torneio, rodada) para `scoring-header-meta.tsx` (~35L). | ~70L |
| 9 | `src/components/scoring/action-bar-footer.tsx` | 108L | Extrair controles secundários (tema, comentário, editar placar, estatísticas) para `action-bar-secondary-controls.tsx` (~45L). | ~65L |
| 10 | `src/components/scoring/live-counters-grid.tsx` | 138L | Extrair componente `StatCell` para `live-counters-stat-cell.tsx` (~35L). | ~85L |
| 11 | `src/services/match-template-create.logic.ts` | 104L | Extrair `createAnnotationFromTemplate` para `match-annotation-create.logic.ts` (~55L) e re-exportar para compatibilidade. | ~50L |
| 12 | `src/app/atletas/ranking-form-fields.tsx` | 149L | Extrair `RankingDateField` para `ranking-date-field.tsx` (~25L) e linhas secundárias para `ranking-form-rows.tsx` (~65L). | ~65L |
| 13 | `src/lib/ranking/ranking-eligibility-logic.ts` | 104L | Extrair categorias oficiais por idade para `ranking-official-category.logic.ts` (~60L) e re-exportar para compatibilidade. | ~45L |

---

## 2. 🐟 The Goldfish — Auditoria de Riscos & Premissas

1. **Premissas Implícitas**: Nenhuma nova dependência npm ou alteração em banco de dados é necessária. Trata-se puramente de refatoração estrutural (SRP) e extração de subcomponentes/módulos irmãos.
2. **Breaking Changes**: Zero breaking changes. Todos os hooks, props, nomes de componentes, rotas HTTP e funções exportadas mantêm 100% da assinatura original. As funções extraídas em `src/services/` e `src/lib/` serão re-exportadas a partir do arquivo original para preservar compatibilidade com todos os importadores existentes.
3. **Injeção de Padrões**: Todos os novos arquivos seguirão rigorosamente o Telemetry Design System (sem classes Tailwind genéricas proibidas) e a regra R-03 ($\le 100$ linhas).
4. **Validação**: A execução será validada com:
   - `pnpm check:r03` (deve zerar todas as 13 novas violações)
   - `pnpm typecheck` (0 erros)
   - `pnpm test` (nas suítes afetadas de gestor, scoring e ranking)

**Veredito do Goldfish:** `PASS` — Seguro para execução cirúrgica.
