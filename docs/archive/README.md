# docs/archive — Planos concluídos / históricos

Esta pasta reúne planos de execução já finalizados (status "Concluído" ou meta alcançada), mantidos como referência histórica. Não devem ser editados; serve de auditoria do que foi entregue.

## Critério de inclusão

Um plano vai para `archive/` quando:

- tem seção/status **Concluído** ou **Meta alcançada** no próprio documento, **e**
- não é referenciado como "pendente de execução" em `docs/MEMORY.md` (§2.x) nem em `docs/TASKS.md` como tarefa em aberto.

## Conteúdo

| Arquivo | Origem | Status no documento | Motivo do arquivo |
|---------|--------|---------------------|-------------------|
| `PLANO_REFATORACAO_STEDEV.md` | Engenharia Reversa (skill ste-dev) | Concluído (Fases 1-4 + R-02/R-03/R-06/R-08) | Execução detalhada fase a fase, já entregue |
| `PLANO_CORRECAO_AUDITORIA_STE_DEV.md` | Auditoria STE-DEV (skill ste-dev) | Concluído (Fases 1-4 executadas, DoD 100% verde) | Correções de RLS, rotas, Zod, console.log, modularização, window.confirm, glossário |
| `PLANO_DUPLAS_2026-10-21.md` | Jogo em duplas | Concluído (2026-10-22, TASKS A0) | Funcionalidade entregue |
| `PLANO_R03_TOP10_S3.md` | R-03 (≤100 linhas) | Concluído — meta alcançada (baseline 124 → 0) | Backlog R-03 zerado |
| `PLANO_REMEDIACAO_ACESSO_E_SEGURANCA.md` | Auditoria de modelo de acesso | Concluída (2026-10-26) | Todas as vulnerabilidades remediadas |
| `PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md` | Pool de busca / cadastro / claim | Concluído (Fases 0-6, MEMORY §2.3) | Todas as fases entregues |
| `baseline-2026-16-07.md` | Baseline de testes | Histórico (commit 6e401a2) | Referência de linha de base verde |
| `PLANO – Estatísticas Avançadas.md` | Estatísticas avançadas (ITF/ATP) | Concluído (2026-10-25, TASKS A0.1) | 5 fases entregues |
| `PLANO_EXECUCAO_EDITAR_PLACAR_2026-10-24.md` | Execução PRs "Editar placar" | Plano de execução (PR-0..PR-8) | Mapa de PRs, não plano ativo |

## Planos mantidos na raiz de `docs/`

Os planos abaixo estão **ativos / pendentes de execução** e permanecem na raiz:

- `PLANO_CORRECAO_AUDITORIA_STE_DEV.md` — auditoria STE-DEV (fases 1-4 executadas)
- `PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md` — aprovado, pronto para execução (4 etapas)
- `PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md` — aprovado para execução
- `PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md` — planejado para execução
- `PLANO_TRATAMENTO_E_MENSAGENS_DE_ERRO_UX_2026-10-27.md` — proposto / planejado
- `PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md` — referência (não altera código)
- `PLANO_ALTERACOES_RKT_2026-10-27.md` — plano (nenhum arquivo alterado ainda)
- `PLANO_ENDURECIMENTO_2026-10-06.md` — proposto, aguardando decisões
- `Painel_Geral.md` — versão filtrada da fundação de perfis

## Arquivos canônicos (não mover)

Os 6 arquivos-canônicos definidos em `AGENTS.md` permanecem na raiz:

`PRD.md` · `ARCHITECTURE.md` · `RULES.md` · `DESIGN.md` · `TASKS.md` · `MEMORY.md`

Junto com eles: `glossario.md` (R-01) e `ste-dev.md` (rastreabilidade da auditoria).
