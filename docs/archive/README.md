# docs/archive — Planos concluídos / históricos

Esta pasta reúne planos de execução e artefatos já finalizados (status "Concluído" ou meta alcançada), mantidos como referência histórica. Não devem ser editados; servem de auditoria do que foi entregue.

## Critério de inclusão

Um documento vai para `archive/` quando:

- tem seção/status **Concluído** ou **Meta alcançada** no próprio documento, **e**
- não é referenciado como "pendente de execução" em `docs/MEMORY.md` (§2.x) nem em `docs/TASKS.md` como tarefa em aberto.

## Conteúdo

| Arquivo | Origem | Status no documento | Motivo do arquivo |
|---------|--------|---------------------|-------------------|
| `PLANO_EXECUCAO_UNIFICADA.md` | Master plan unificado | Concluído (Etapa 0, Ondas 1 a 4, 100% verde) | Plano mestre consolidado de endurecimento, perfis, core e UX |
| `PLANO_REFATORACAO_STEDEV.md` | Engenharia Reversa (skill ste-dev) | Concluído (Fases 1-4 + R-02/R-03/R-06/R-08) | Execução detalhada fase a fase, já entregue |
| `PLANO_CORRECAO_AUDITORIA_STE_DEV.md` | Auditoria STE-DEV (skill ste-dev) | Concluído (Fases 1-4 executadas, DoD 100% verde) | Correções de RLS, rotas, Zod, modularização, glossário |
| `PLANO_DUPLAS_2026-10-21.md` | Jogo em duplas | Concluído (2026-10-22, TASKS A0) | Funcionalidade entregue |
| `PLANO_R03_TOP10_S3.md` | R-03 (≤100 linhas) | Concluído — meta alcançada (baseline 124 → 0) | Backlog R-03 zerado |
| `PLANO_REMEDIACAO_ACESSO_E_SEGURANCA.md` | Auditoria de modelo de acesso | Concluída (2026-10-26) | Todas as vulnerabilidades remediadas |
| `PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md` | Pool de busca / cadastro / claim | Concluído (Fases 0-6, MEMORY §2.3) | Todas as fases entregues |
| `PLANO – Estatísticas Avançadas.md` | Estatísticas avançadas (ITF/ATP) | Concluído (2026-10-25, TASKS A0.1) | 5 fases entregues |
| `PLANO_EXECUCAO_EDITAR_PLACAR_2026-10-24.md` | Execução PRs "Editar placar" | Plano de execução (PR-0..PR-8) | Mapa de PRs concluído |
| `PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md` | Roteamento por perfil e autorização | Concluído (Onda 1) | Entregue no plano unificado |
| `PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md` | Painéis Gestor e Suporte | Concluído (Onda 2) | Entregue no plano unificado |
| `PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md` | Edição de Clubes, Gestores e Membros | Concluído (Onda 2) | Entregue no plano unificado |
| `PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md` | Menus dinâmicos e ecossistema | Concluído (Ondas 1 e 2) | Entregue no plano unificado |
| `PLANO_ALTERACOES_RKT_2026-10-27.md` | Funcionalidade Core e placar | Concluído (Onda 3) | Entregue no plano unificado |
| `PLANO_TRATAMENTO_E_MENSAGENS_DE_ERRO_UX_2026-10-27.md` | Tratamento de erros e UX | Concluído (Onda 4) | Entregue no plano unificado |
| `PLANO_ENDURECIMENTO_2026-10-06.md` | Endurecimento e testes | Concluído (Etapa 0) | Entregue no plano unificado |
| `PLANO_ENDURECIMENTO_TAREFAS_NAO_EXECUTADAS.md` | Pendências de endurecimento | Concluído (Etapa 0) | Entregue no plano unificado |
| `Painel_Geral.md` | Fundação de perfis e acessos | Concluído / Referência histórica | Especificação original de domínio já materializada |
| `PR9_MIGRATION.sql` | Migration SQL manual PR-9 | Histórico | Migration de integridade referencial do Editar Placar |
| `baseline-2026-16-07.md` | Baseline inicial de testes | Histórico (commit 6e401a2) | Referência de linha de base legada |

## Estrutura da raiz de `docs/`

A raiz da pasta `docs/` permanece rigorosamente limpa e higienizada, contendo apenas:

### Arquivos Canônicos (Fonte Única de Verdade)
- `PRD.md` — Product Requirements Document
- `ARCHITECTURE.md` — Arquitetura do Sistema
- `RULES.md` — Regras de Desenvolvimento (STE-DEV)
- `DESIGN.md` — Design System
- `TASKS.md` — Backlog do Projeto
- `MEMORY.md` — Histórico e Contexto

### Arquivos de Apoio e Linha de Base
- `glossario.md` — Glossário de termos ubíquos (R-01)
- `ste-dev.md` — Rastreabilidade da metodologia STE-DEV
- `BASELINE-2026-10-29.md` — Linha de base estrita de testes atual (397 suítes, 3.910 testes)

### Subdiretórios
- `golden/` — Snapshots dourados de regressão
- `archive/` — Planos e artefatos concluídos (este diretório)
