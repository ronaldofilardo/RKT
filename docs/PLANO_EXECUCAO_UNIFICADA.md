# PLANO DE EXECUÇÃO UNIFICADA — RKT

**Data:** 2026-10-29  
**Origem:** consolidação dos planos ativos na raiz de `docs/`  
**Planos consolidados:**
- `PLANO_ENDURECIMENTO_2026-10-06.md` → Etapa 0
- `PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md` → Onda 1
- `PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md` → Onda 2
- `PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md` → Onda 2
- `PLANO_ALTERACOES_RKT_2026-10-27.md` → Onda 3
- `PLANO_TRATAMENTO_E_MENSAGENS_DE_ERRO_UX_2026-10-27.md` → Onda 4
- `Painel_Geral.md` → referência de modelo de domínio e matriz de permissões (todas as ondas)

**Método:** characterization-first (RULES §7), baby steps, um assunto por entrega, `check:r03` (< 100 linhas), `ste-exception` documentada quando houver exceção, `pnpm test:strict` verde após cada onda.

---

## Etapa 0 — Endurecimento e Baseline Verde

**Fonte:** `docs/PLANO_ENDURECIMENTO_2026-10-06.md` (status: proposto, aguardando decisões)

### Objetivo
Estabelecer linha de base verde e regras de proteção antes de qualquer alteração de código de produção.

### Tarefas

| ID | Tarefa | Detalhe |
|----|--------|---------|
| E0.1 | Executar baseline local | `pnpm install --frozen-lockfile`, `pnpm prisma generate`, `pnpm test:setup`, `pnpm typecheck`, `pnpm lint`, `pnpm test:strict`, `pnpm test:components`, `pnpm build`, `pnpm test:e2e`, `pnpm test:coverage` |
| E0.2 | Salvar linha de base | Criar `docs/BASELINE-2026-10-xx.md` com número de suítes, testes, cobertura, duração e hash do commit. Criar tag git `baseline-pre-hardening`. |
| E0.3 | Golden snapshots | Gravar respostas de `/report` com partida fixture (com e sem áudio), `/matches`, login (resposta e cookies), fluxo `/point`. |
| E0.4 | Checklist de fumaça em `/scoring` | ace, dupla falta, cancelar 2º saque, undo, editar placar, offline e reconexão, timeline e relatório. |
| E0.5 | Backup | Branch do Neon e zip sem arquivos `.env`. |

### Critérios de Aceite (DoD Etapa 0)
- [x] 0 falhas, 0 skipped, 0 todo
- [x] Typecheck com 0 erros
- [x] Lint sem warnings
- [x] Build ok
- [x] Suíte executada duas vezes (sem flakiness)
- [x] Backup do Neon realizado

---

## Onda 1 — Contas, Perfis, Roteamento e Autorização de Partidas

**Fontes:** `PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md` (Etapas 1-4), `PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md` (Fase 1), `Painel_Geral.md` (§7, §13-14)

### 1.1 Segurança Crítica e Autorização de Partidas (Urgência Alta)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 1.1.1 | Corrigir identidade do atleta na partida | Comparar `player1Id`/`player2Id` com `actor.athletePlayerId` (resolvido via `Player.userId`), nunca com `User.id`. Eliminar comparação incorreta em `visibility.ts:33`. |
| 1.1.2 | Autorização "falha fechada" (fail-closed) | Se a sessão não for encontrada ou o modelo falhar, a autorização retorna estritamente `false`. |
| 1.1.3 | Unificar autorização em `canReadMatch` / `canAnnotateMatch` | Centralizar a autorização de `GET`, `state`, `point` e `finish` nas funções puras do núcleo de acesso (`src/core/access/`). |
| 1.1.4 | Corrigir link de visualização no Gestor | Em `club-matches-table.tsx`, apontar para `/match/${m.id}/report` (ou `/match/${m.id}/scoring` se em andamento). |

### 1.2 Roteamento Canônico, Home por Perfil e Middleware

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 1.2.1 | Implementar `homeForProfile(actor)` | Função pura em `src/core/access/home.ts`: `ADMIN → /admin`, `SUPORTE → /suporte`, `GESTOR → /gestor`, `TREINADOR → /dashboard` (ou `/treinador` quando disponível), `ATLETA → /dashboard` (ou `/atleta` quando disponível). |
| 1.2.2 | Corrigir o middleware | Remover código morto em `middleware-auth.logic.ts`; usuários autenticados que acessem `/login` redirecionam para `homeForProfile`; garantir `SUPORTE → /suporte`. |
| 1.2.3 | Incluir `mustChangePassword` na resposta de login | Devolver `mustChangePassword` no JSON retornado por `POST /api/auth/login`. |

### 1.3 Layout Compartilhado e Navegação por Perfil

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 1.3.1 | Layout compartilhado com sidebar | Promover `DashboardChrome` / `DashboardSidebar` para layout compartilhado envolvente de `/dashboard`, `/gestor`, `/suporte` e `/admin`. |
| 1.3.2 | Marcar rotas em desenvolvimento | Marcar `/atleta/*` e `/treinador/*` no menu com `badge: 'Em breve'` e `disabled: true` enquanto não possuírem páginas implementadas. |
| 1.3.3 | Botões de Voltar | Usar `homeForProfile` ou histórico seguro em vez de assumir estaticamente `/dashboard`. |

### 1.4 Adequação ao Design System e Limpeza de Código Morto

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 1.4.1 | Migrar para tokens `telemetry-*` | Substituir `bg-gray-*`, `bg-sky-*`, `bg-white`, `text-gray-*` nas páginas `/gestor`, `/suporte` e `/admin` pelos equivalentes do tema (`telemetry-bg`, `telemetry-card`, `telemetry-primary`, `telemetry-text-primary`, etc.). |
| 1.4.2 | Remover código morto | Descontinuar hook não utilizado `useAccess` e sincronizar arquivos redundantes. |

### Critérios de Aceite (DoD Onda 1)
- [x] `pnpm test:strict` 100% verde sem nenhum teste pulado (`check-no-skipped-tests.mjs`)
- [x] `pnpm typecheck` com 0 erros
- [x] `pnpm lint` sem erros/warnings
- [x] Nenhum 404 em links internos
- [x] Registro contínuo das etapas em `docs/TASKS.md` e `docs/MEMORY.md`

---

## Onda 2 — Painéis Gestor (`/gestor`) e Suporte (`/suporte`)

**Fontes:** `PLANO_GESTOR_CLUBE_E_SUPORTE_2026-10-26.md` (Fases 2-7), `PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md` (Fases 1-4)

### 2.1 Fase 1 — Segurança de APIs Existentes (pré-requisito)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.1.1 | Proteger `GET /api/users` | Adicionar guarda `withAccessHandler`; limitar listagem a `PLATAFORMA:ADMIN` ou `PLATAFORMA:SUPORTE`. |
| 2.1.2 | Isolamento de tenant em `/api/cts/[id]/athletes` | Verificar contexto: usuário deve ser `GESTOR` do CT ou `SUPORTE`/`ADMIN`. Impedir que gestores vinculem atletas a CTs de terceiros. |
| 2.1.3 | Corrigir papel em `/api/invites/accept` | Converter `InviteKind`: convite de atleta → `PlayerCT`, convite de gestor → `Membership` `GESTOR`. |
| 2.1.4 | Proteger dados de PJ em `GET /api/training-centers` | Usuários com `report:view` recebem projeção pública (`id`, `name`, `slug`). Dados completos de PJ (CNPJ, razão social, telefone) apenas para `GESTOR` do CT ou `SUPORTE`/`ADMIN`. |
| 2.1.5 | Escopo de leitura de partidas para espectador | Auditar `matches-get.logic.ts` para garantir que usuários sem CT nem vínculo de treinador visualizem apenas partidas com `createdByUserId = session.userId`. |

### 2.2 Fase 2 — Modelagem de Dados e Validações

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.2.1 | Extender modelo `TrainingCenter` | Adicionar `cnpj` (`String? @unique`), `legalName`, `phone`, `email`, `address` (`Json?`), `legalRepName`, `legalRepCpf`, `legalRepEmail`, `legalRepPhone`, `status` (`String @default("PENDING")`: `PENDING`, `ACTIVE`, `SUSPENDED`). |
| 2.2.2 | Extender modelo `User` | Adicionar `mustChangePassword` (`Boolean @default(false)`), `tempPasswordExpiresAt` (`DateTime?`). |
| 2.2.3 | Migração do banco | Migração aditiva via Prisma (`prisma migrate dev` ou SQL declarativo compatível com Neon). Sem impacto em registros existentes. |
| 2.2.4 | Criar validadores | `cnpj.validator.ts` (máscara e dígitos verificadores), `cpf.validator.ts` (validação algorítmica rigorosa). |
| 2.2.5 | Criar schemas Zod | `gestor-signup.schema.ts` (dados da PJ + responsável), `coach-create.schema.ts` (nome, CPF, nascimento, e-mail), `athlete-create.schema.ts` (nome, CPF, nascimento, gênero, lateralidade). |

### 2.3 Fase 3 — Onboarding de Gestor e Clube (`/signup`)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.3.1 | Seleção de perfil no `/signup` | Adicionar botão/card "Gestor de Clube / CT" ao lado de Atleta, Treinador e Espectador. Interceptar formulário padrão e abrir fluxo modal de onboarding PJ. |
| 2.3.2 | Modal multi-etapas | Passo 1: dados do Clube/PJ (CNPJ, Razão Social, Nome Fantasia, telefone, e-mail, endereço, representante legal). Passo 2: conta do responsável (checkbox "é o mesmo representante legal", cópia automática de dados, senha, confirmação). |
| 2.3.3 | Endpoint atômico `POST /api/auth/signup-gestor` | Rate limit por IP; transação `prisma.$transaction`: validar unicidade de CNPJ/CPF/e-mail, gerar `slug` único, criar `TrainingCenter` com status `PENDING`, criar `User` (`role: ANNOTATOR`, `canOperate: true`), criar `Membership` tipo `GESTOR`, gravar `AuditLog`. Retornar confirmação de que o clube está em análise. |

### 2.4 Fase 4 — Autenticação, Perfis e Roteamento Inteligente

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.4.1 | Enriquecer `/api/auth/me` | Incluir lista de vínculos ativos (`memberships` com `kind`, `ctId`, `status`), status do CT vinculado (`ctStatus`), flag `mustChangePassword`. |
| 2.4.2 | Interceptação de senha provisória | Se `mustChangePassword === true`, usuário só pode acessar `/trocar-senha`. Qualquer outra rota autenticada redireciona para lá. |
| 2.4.3 | Roteamento por perfil | `PLATAFORMA/ADMIN → /admin`; `PLATAFORMA/SUPORTE → /suporte`; `GESTOR → /gestor` (se CT `PENDING`, exibir componente de aviso/aguardo); `TREINADOR`, `ATLETA`, `ESPECTADOR → /dashboard`. |

### 2.5 Fase 5 — Painel do Gestor (`/gestor`)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.5.1 | Estrutura da página | Cabeçalho com nome do CT, CNPJ, badge de status; cards de contagem (Total de Treinadores, Total de Atletas Ativos, Partidas Realizadas); abas: Treinadores, Atletas, Dados do Clube, Gestores Adicionais. |
| 2.5.2 | Cadastro de treinador | Modal com Nome, CPF, Data de Nascimento, E-mail; `POST /api/gestor/coaches` escopado ao `ctId`; criar `User` com login por CPF e senha provisória `DDMMAAAA`; `mustChangePassword: true`, `tempPasswordExpiresAt: now + 7 dias`; criar `Membership` `TREINADOR`; criar `PasswordResetRequest` (7 dias); exibir modal com link de primeiro acesso. |
| 2.5.3 | Regeneração de link (treinador) | Botão "Gerar novo link de acesso" na linha do treinador (revoga token anterior e emite novo de 7 dias). |
| 2.5.4 | Cadastro de atleta | Modal com Nome, CPF, Data de Nascimento, E-mail (opcional), Gênero, Lateralidade; `POST /api/gestor/athletes`; se CPF já existir, erro amigável com opção de enviar convite via `LinkInvite` tipo `ATLETA`; se novo, criar `User`, `Player` e `PlayerCT` em transação; emitir `PasswordResetRequest` de 7 dias. |
| 2.5.5 | Regeneração de link (atleta) | Botão para regerar link de primeiro acesso a qualquer momento. |
| 2.5.6 | Convidar co-gestores | Usar infraestrutura existente de `LinkInvite` (`kind: GESTOR`). |

### 2.6 Fase 6 — Painel do Suporte (`/suporte`)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.6.1 | Script de provisionamento | `scripts/create-support-user.ts` para criar ou promover o primeiro usuário `SUPORTE` diretamente via CLI/banco. |
| 2.6.2 | Módulo Clubes e CTs | Filtro de Status (Pendentes/Ativos/Suspensos); visualização detalhada de dados do CT; botão "Aprovar Clube" (altera para `ACTIVE`); botão "Suspender Clube"; edição de dados cadastrais da PJ. |
| 2.6.3 | Módulo Gestores | Listagem de gestores por clube; suspender gestor individual; trocar representante responsável; "Encerrar Todas as Sessões" (incrementar `sessionVersion`). |
| 2.6.4 | Módulo Contas Avulsas | Consultar, auditar e vincular manualmente atletas/treinadores/espectadores sem CT. |

### 2.7 Fase 7 — Qualidade, RLS, Testes e Conformidade

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 2.7.1 | Regras de código | R03 (< 100 linhas por arquivo); rotas finas (`route.ts`); lógica pura em `*.logic.ts`; consultas em repositórios dedicados; validações Zod em schemas separados. |
| 2.7.2 | RLS no Neon/PostgreSQL | Revisar e aplicar políticas de Row Level Security para novas colunas e tabelas de CT e vínculos (`training_centers`, `player_cts`, `memberships`). |
| 2.7.3 | Testes unitários | Validadores de CNPJ e CPF; cálculos e formatação de senha provisória `DDMMAAAA`; lógica de expiração (7 dias) e flag `mustChangePassword`. |
| 2.7.4 | Testes de integração de API | `POST /api/auth/signup-gestor` (CNPJ repetido, criação atômica); criação de Treinador e Atleta pelo Gestor com checagem de escopo do `ctId`; aprovação de CT pelo Suporte e bloqueio de acesso de CT `PENDING`. |
| 2.7.5 | Testes E2E (Playwright) | Fluxo completo: Cadastro de Gestor → Aprovação pelo Suporte → Login do Gestor → Cadastro de Treinador → Primeiro acesso do Treinador com troca obrigatória de senha. |

### Critérios de Aceite (DoD Onda 2)
- [x] Todas as rotas de leitura/escrita de CT, usuário, treinador e atleta protegidas por `withAccessHandler`
- [x] `pnpm typecheck` 0 erros
- [x] `pnpm lint` 0 erros
- [x] `pnpm check:r03` 0 violações
- [x] `pnpm test:strict` verde
- [x] `AuditLog` ativo para alterações cadastrais

---

## Onda 3 — Funcionalidade Core (Nova Partida, Duplicidade, Dashboard, Estatísticas)

**Fonte:** `PLANO_ALTERACOES_RKT_2026-10-27.md` (Fases 1-5)

### 3.1 Fase 1 — Nova Partida (B1, B3)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 3.1.1 | `match-type-toggle.tsx` | Rótulos "Simples" e "Duplas". |
| 3.1.2 | `DateTimeSection.tsx` | Remover bloco "Atenção"; remover asterisco de "Data". |
| 3.1.3 | `useNewMatchState.ts` | Remover preenchimento automático com hoje na criação. |
| 3.1.4 | `new-match-validate-fields.logic.ts` | Tirar `Data` dos obrigatórios. |
| 3.1.5 | `build-match-payload.logic.ts` | Sem data; `scheduledAt` fica indefinido. |
| 3.1.6 | Preencher hoje ao iniciar anotação | Definir único ponto de gravação em `start-match.logic.ts`, `useNewMatchSubmissionActions.ts` e transição de estado. |
| 3.1.7 | Verificar efeito de `scheduledAt` nulo | Dashboard (badge, ordenação) e checagem de duplicidade. |
| 3.1.8 | Testes | `PlayerSelection.characterization`, `NewMatchPage.test`, `createdMatchId.regression`, `useNewMatchSubmissionActions.scheduled`, `schedule-check.helpers`. |

### 3.2 Fase 2 — Duplicidade (B2)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 3.2.1 | Reproduzir cenário de duplicidade | Simples entre A e B, depois dupla com A, B e dois parceiros, depois nova tentativa. |
| 3.2.2 | `findDuplicateMatch` | Receber `matchType` e parceiros; duplas comparadas como conjuntos de dois lados (qualquer ordem); simples nunca colide com dupla. |
| 3.2.3 | `matches-post.logic.ts` | Passar novos campos; ajustar chave do advisory lock (hoje só usa os dois jogadores). |
| 3.2.4 | `DuplicateMatchModal.tsx` | Texto "no mesmo dia"; exibir tipo (simples ou duplas) e data da partida existente. |
| 3.2.5 | Testes | `create-match.test`, `route.test` (matches), `doublesMatchCreation.test`, novos casos simples×dupla, dupla×dupla com lados invertidos. |

### 3.3 Fase 3 — Nomes de Dupla (C)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 3.3.1 | Utilitário único de abreviação | Tratamento de nome único, iniciais repetidas, nomes longos. |
| 3.3.2 | `PlayerCard` | Nome da dupla abreviado em uma linha, no lugar das duas linhas atuais; `aria-label`. |
| 3.3.3 | `ScoreboardCard` e `ScoreboardPlayerRow` | Receber parceiros e usar o utilitário; ajustar largura da coluna de nome (`truncate` com `title`). |
| 3.3.4 | Testes | `PlayerCard.*`, `ScoreboardCard.*`, `design-pattern.characterization`, `scoring.page.characterization`. |

### 3.4 Fase 4 — Card do Dashboard (A)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 3.4.1 | Regra do sobrescrito | Corrigir `renderSetScore` (scoring) e `formatCompactSetScore` (dashboard) ou unificá-los. |
| 3.4.2 | `getColumnTitles` | `BEST_OF_5` passa a Set 1 a 4 e TB. |
| 3.4.3 | `MatchCard` | Usar estrutura do `ScoreboardCard` com cores de quadra e suspenso, nomes de dupla da Fase 3, sem pontos do game. |
| 3.4.4 | Extrair parte visual compartilhada | Em vez de duplicar. Respeitar limite de 500 linhas. |
| 3.4.5 | Testes | `match-card-utils.tiebreak-fix`, `match-card-utils.tiebreak-display`, `MatchCard.tiebreak-column`, `MatchCard.test`, `MatchCard.doubles`, testes de `getColumnTitles` e de `ScoreboardCard`. |

### 3.5 Fase 5 — Estatísticas Avançadas (D)

Ordem sugerida: D3, D4, D6, D7, D8. Cada uma com teste antes.

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 3.5.1 | D3 — Fundo de Quadra | `baseline-stats.logic.ts`, `advanced-stats-baseline-section.tsx`; linhas: Winner, Erro Não Forçado, Erro Forçado, Aproveitamento/Total (x/y), % Aproveitamento, Pontos até 4 trocas, de 5 a 8 e acima de 9 (ganhos/total). |
| 3.5.2 | D4 — Rally | `pressure-shot-stats.ts`, `advanced-stats-rally-section.tsx`; totais por set e do jogo; agrupar por `setNumber`; rótulos Curtos (1-4), Médios (5-8), Longos (9+); duração média = soma das trocas ÷ pontos com rally; corrigir rótulo errado em `advanced-stats-shot-section.tsx` se estiver em uso. |
| 3.5.3 | D6 — Estatísticas dos Golpes | `stroke-matrix-classify.logic.ts`, `stroke-matrix-stats.logic.ts`; ordem: Sq, FH, BH, VFH, VBH, SVFH, SVBH, Sm, Drop, Lob, Bate Pronto, Aproach FH, Aproach BH; separar `aproachs` em `aproach_fh` e `aproach_bh`; linha Sq: W = aces, ENF = duplas faltas, EF = 0 (a confirmar). |
| 3.5.4 | D7 — Momentum | `momentum-stats.ts`, `advanced-stats-momentum.tsx`; tabela por jogador com contagem de sequências exatas de 2, 3 e 4+. |
| 3.5.5 | D8 — Breakdown por Set | `set-breakdown-stats.ts`, `advanced-stats-set-breakdown.tsx`; manter colunas atuais e indicador TB; acrescentar tempo total do jogo (`stats.durations.totalDurationMinutes`) e duração por set (`setDurations`). |

### Critérios de Aceite (DoD Onda 3)
- [x] `pnpm typecheck` 0 erros
- [x] `pnpm lint` 0 erros
- [x] `pnpm check:r03` 0 violações (arquivos < 500 linhas conforme decisão deste plano, seção 3)
- [x] `pnpm test:strict` verde
- [x] `pnpm test:design` verde (3/3 suítes)
- [x] Atualizar `docs/TASKS.md` e `docs/MEMORY.md`; `docs/api/CONTRACTS.md` se a assinatura de duplicidade mudar; rodar `pnpm spec:validate`
- [x] Um commit por fase, sem misturar fases

---

## Onda 4 — UX, Qualidade e Limpeza

**Fontes:** `PLANO_TRATAMENTO_E_MENSAGENS_DE_ERRO_UX_2026-10-27.md` (Etapas 1-4), `PLANO_ENDURECIMENTO_2026-10-06.md` (Fase 6)

### 4.1 Etapa 1 — Backend: Formatação Automática de Erros Zod

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 4.1.1 | Criar `formatZodMessage` | Em `src/lib/api-response.logic.ts`; função pura que extrai a primeira mensagem relevante do Zod para o atributo `message` da resposta. |
| 4.1.2 | Resposta padronizada | Todas as rotas que validam payload via Zod retornam `{ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }` com status 400. |
| 4.1.3 | Leitura segura | Manter regra `request.json().catch(() => null)`. |

### 4.2 Etapa 2 — Frontend: Extrator Universal de Mensagens de Erro

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 4.2.1 | Criar `extractErrorMessage` | Em `src/lib/error-parser.ts` (novo módulo puro, < 100 linhas, R-03); função pura que extrai string direta, `message` legível, `details.fieldErrors`, dicionário de traduções, `Failed to fetch`, fallback padrão. |

### 4.3 Etapa 3 — Interface: Eliminação de `alert()` e Feedback de Formulário

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 4.3.1 | Notificações | Substituir todas as chamadas a `window.alert()` por `useToast()`; toasts de sucesso para ações assíncronas concluídas. |
| 4.3.2 | Modais de cadastro e edição | (`EditarAtletaModal`, `EditarTreinadorModal`, `CadastrarMembroModal`, `EditarClubeModal`, `EditarGestorModal`); destaque visual nos campos com erro (borda vermelha + mensagem de apoio); bloqueio de duplo clique com estado `loading`. |

### 4.4 Etapa 4 — Limpeza Geral (do `PLANO_ENDURECIMENTO` Fase 6)

| ID | Tarefa | Detalhe |
|----|--------|---------|
| 4.4.1 | Migrar `console.*` | Migrar os 31 `console.*` restantes para o `logger`. |
| 4.4.2 | Reduzir `any` | Reduzir os 215 `any` pelos focos: `DashboardViewRouter` (20), `useDashboardMatches` (14), `score-normalizer` (11), `MatchCard` (10) e casts no caminho do ponto (`match as any`, `scoreState as any`, `format as any`). |
| 4.4.3 | Tipo único para envelope | Criar tipo único e validação Zod para o envelope `{state, history}`, começando só em modo log. |
| 4.4.4 | Arquivar código morto | Arquivar `useMatchEvents.ts` (sem uso em produção). |
| 4.4.5 | Atualizar documentação | Atualizar `TASKS.md`, `PRD.md` e `AGENTS.md`; revisar `.gitignore` para `coverage/`, `playwright-report/`, `tsconfig.tsbuildinfo` e `graft/`. |
| 4.4.6 | Pausar polling | Pausar o polling de 5s do painel de sessão quando a aba estiver oculta. |

### Critérios de Aceite (DoD Onda 4)
- [x] 0 ocorrências de `window.alert()` em código de produção
- [x] 0 mensagens técnicas como `"VALIDATION_ERROR"`, `"CONFLICT"` ou `"SyntaxError"` visíveis ao usuário final
- [x] Todas as rotas de API respondem com propriedade `message` compreensível em português ao falhar validação
- [x] Formulários destacam os campos com erro e orientam o usuário sobre a correção necessária
- [x] `pnpm check:r03` 0 violações (todos os arquivos < 100 linhas, exceto `ste-exception` documentadas)
- [x] `pnpm typecheck` 0 erros
- [x] `pnpm lint` 0 erros/warnings
- [x] Suítes de testes atualizadas e verdes
- [x] `pnpm test:strict` verde

---

## Critérios Gerais de Saída (Todos os planos)

- **Zero regressão:** `pnpm test:strict` verde (3904/3904 testes, 397 suítes na baseline atual).
- **TypeScript:** `pnpm typecheck` executando com 0 erros.
- **Lint:** `pnpm lint` 0 erros, 0 warnings.
- **R03:** Todos os arquivos novos e modificados estritamente abaixo de 100 linhas de código (exceto `ste-exception` documentada).
- **Design:** `pnpm test:design` 3/3 suítes verdes.
- **Nenhum commit misturando ondas:** um commit por onda/fase.
- **Documentação atualizada:** `docs/TASKS.md` e `docs/MEMORY.md` registram cada entrega concluída.

---

## Ordem de Execução Recomendada

1. **Etapa 0** — `PLANO_ENDURECIMENTO` (baseline verde, sem alterar código de produção)
2. **Onda 1** — Contas, perfis, roteamento e autorização de partidas (bloqueante para segurança)
3. **Onda 2** — Painéis Gestor e Suporte (funcionalidade de negócio)
4. **Onda 3** — Funcionalidade core (nova partida, duplicidade, dashboard, estatísticas)
5. **Onda 4** — UX, qualidade e limpeza (tratamento de erros, `console.*`, `any`, design system)

**Nota:** As fases C–H de duplas (do `PLANO_ALTERACOES_RKT`) podem correr em paralelo à Onda 2 desde que não toquem os mesmos arquivos (alinhar por onda).
