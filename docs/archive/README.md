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
| `PLANO_ACOMPANHAMENTO_PARTIDAS_AO_VIVO_2026-10-29.md` | Transmissão ao vivo / espectador | Concluído (2026-10-29, TASKS A0.7, MEMORY §2.7) | 6 fases entregues (domínio, DB, APIs, heartbeat, UI, 10 estados) |
| `PLANO_AREAS_ATIVAS_E_URLS_POR_AREA_2026-11-01.md` | Área ativa e URLs semânticas | Concluído (2026-11-01, TASKS A0.9, MEMORY §2.12) | Fases 0 a 7 entregues |
| `PLANO_DUPLAS_JUST_IN_TIME_E_EDICAO_SACADOR_2026-11-04.md` | Duplas just-in-time e edição de sacador | Concluído (2026-11-04, MEMORY §2.21) | 3 pilares entregues (JIT, ponto decisivo No-Ad, troca de sacador) |
| `PLANO_UI_TRANSMISSAO_COMPARTILHADA_E_GESTOR_2026-11-07.md` | UI da transmissão compartilhada e do Gestor | Concluído (2026-11-07, MEMORY §2.27) | Hierarquia visual entregue sem alteração de dados/feed |
| `PLANO_ISOLAMENTO_ANOTACOES_POR_ANOTADOR_2026-11-11.md` | Isolamento de anotações por anotador | Concluído (2026-11-12, TASKS A0.18, MEMORY §2.33) | 7/7 itens do DoD entregues (deploy da migration é pendência operacional) |
| `PLANO_CORRECAO_MENUS_ROTAS_E_SESSAO_2026-11-12.md` | Menus, rotas e blindagem de sessão | Concluído (2026-11-12, TASKS A0.19, MEMORY §2.34) | Fases 1 a 5 entregues |
| `PLANO_REVISAO_UX_WRITING_2026-11-05.md` | Revisão de UX Writing (baby steps) | Concluído (2026-11-14, MEMORY §2.41) | 5 fases verificadas no código; strings antigas removidas de `src/` |
| `PLANO_ONBOARDING_UX_FEEDBACK_2026-11-07.md` | Toast, validação inline, empty states e `/onboarding` | Concluído com resíduo (2026-11-14, MEMORY §2.40) | 4,5 frentes entregues; resíduo §3.4 em `TASKS.md` TD-067 |
| `PLANO_USABILIDADE_OUTDOOR_E_CORES_PERCEPTUAIS_2026-11-03.md` | Cores OKLCH outdoor e contraste AAA | Concluído com resíduos (2026-11-14, MEMORY §2.42) | Tokens, acentos de quadra e suíte WCAG entregues; wiring `text-telemetry-score-*` corrigido em 2026-11-14; 2 resíduos restantes em `TASKS.md` TD-066 |
| `PLANO_CADASTRO_ATLETA_OUTRO_CLUBE_UF_CIDADE_2026-11-01.md` | Cadastro de atleta de outro clube (UF/cidade/clube) | Concluído com resíduos (2026-11-01/09, MEMORY §2.3/§2.43) | Fases 1-7 entregues; resíduos DoD 5 e 6 em `TASKS.md` A0.12 |
| `PLANO_CORRECAO_FILTROS_PARTIDAS_2026-11-11.md` | Correção dos filtros de partidas | Concluído com resíduo (2026-11-14, MEMORY §2.43) | Fases A-D entregues; Fase E em aberto em `TASKS.md` TD-065 |
| `PLANO_POOL_PARTIDAS_PUBLICAS_E_NICKNAME_ATLETA_2026-11-09.md` | Pool de partidas públicas + nickname | Concluído com resíduos (2026-11-09, MEMORY §2.31/§2.43) | 15 itens de DoD entregues; E2E `08` e consentimento de menores (A0.8) em aberto em `TASKS.md` |

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

### Planos de Execução (`PLANO_*.md`) — apenas os NÃO concluídos
A raiz mantém somente planos com execução em aberto (status "Pronto para Execução"/"Planejado" **e** item correspondente não concluído em `TASKS.md`). Desde 2026-11-14 há **apenas um**: `PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md` (A0.8, não iniciada).

> Planos **arquivados com resíduos** seguem com seus itens abertos rastreados em `docs/TASKS.md`: A0.12 (DoD 5 e 6), A0.13 (E2E `08`), A0.14 (menores/A0.8), TD-065 (Fase E dos filtros), TD-066 (outdoor) e TD-067 (onboarding §3.4). O arquivo pode ir para `archive/` mesmo com resíduo, contanto que o resíduo tenha ID próprio no backlog — o que preserva o critério de auditoria acima.

### Subdiretórios
- `golden/` — Snapshots dourados de regressão
- `archive/` — Planos e artefatos concluídos (este diretório)

> **Não usar `.gitignore` para planos concluídos:** o histórico versionado é a auditoria do que foi entregue (critério acima). Ignorar arquivos já rastreados exigiria `git rm --cached` e quebraria os links de `MEMORY.md`/`TASKS.md`.
