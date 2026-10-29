# 📋 Tarefas do Projeto RKT

> **Última atualização:** 2026-10-26  
> **Fonte única de verdade para o backlog do projeto.**

---

## 1. Tarefas Críticas de Testes

### C1. Implementar testes de integração para rotas de API ⏳
- **Prioridade:** Alta
- **Contexto:** 25 rotas API sem cobertura de integração
- **DoD:** Suite Playwright rodando em CI com >80% de cobertura das rotas críticas

### C2. Testes de End-to-End para Offline 🔴
- **Prioridade:** Crítica
- **Contexto:** O fluxo offline (IndexedDB + PWA) e descarga da fila precisam de testes E2E obrigatórios.
- **DoD:** Cenários de PWA offline com Playwright funcionando.

### C3. Implementar testes de mutação (Stryker) ⏳
- **Prioridade:** Média
- **Contexto:** Mutation score atual desconhecido
- **DoD:** Stryker configurado, >70% mutation score em componentes core

---

## 2. Funcionalidades Ausentes (MVP Incompleto)

### A0.7. Acompanhamento de Partidas ao Vivo (Transmissão Espectador) ✅
- **Status:** Concluída (2026-10-29)
- **Documento:** `docs/PLANO_ACOMPANHAMENTO_PARTIDAS_AO_VIVO_2026-10-29.md`
- **DoD:** Implementação completa da transmissão de partidas ao vivo para convidados e espectadores em 6 fases:
  1. *Domínio Puro:* `signal-status.ts` com cálculo de status do feed (`NOT_STARTED`, `LIVE`, `NO_SIGNAL`, `PAUSED`, `FINISHED`), threshold de 30s de heartbeat, e `rhythm-status.ts` (Opção B adaptativa por ritmo de rali/game/set/pausa).
  2. *Banco de Dados e Prisma:* Modelos `MatchShareLink` e `MatchSpectator` com migration `20261029090000_add_match_spectating`.
  3. *Serviços e APIs:* `/api/matches/[id]/share-links`, `/api/spectate/redeem`, `/api/spectate/[matchId]/feed`, `GET /api/spectate/invite/[token]` (pré-visualização segura de convite sem consumo prematuro).
  4. *Heartbeat do Anotador:* `useAnnotatorHeartbeat.ts` com polling silencioso a cada 20s.
  5. *UI do Dono e do Convidado:* Modal de compartilhamento (`ShareSpectateModal`, `ShareSpectateCreateSection`, `ShareSpectateCreatedSection`, `ShareSpectateWatchersList`, `ShareSpectateWatcherRow`) e tela de acompanhar (`SpectatorHeader`, `SpectatorScoreboard`, `SpectatorLastPointBanner`, `SpectatorTabs`, `SpectatorTimeline`, `SpectatorScoreAnnouncer` com `aria-live` em game/set).
  6. *10 Estados de Erro, Conexão e Acesso:* Cobertura completa dos 10 estados do wireframe: `NO_SIGNAL`, `PAUSED`, `NOT_STARTED`, `FINISHED`, `OFFLINE`, `403 ACCESS_REVOKED`, `404 INVITE_INVALID`, `409 SPECTATOR_LIMIT`, `EMPTY` (dono), `500 / rede` (dono) com `SpectatorStatusBanner` e `SpectatorEmptyState`.
  - 100% STE-DEV R-03 (1039 arquivos ≤ 100 linhas, 0 violações). 13 suítes e 51 testes do ecossistema de spectate 100% verdes. `typecheck` e `test:design` 100% verdes.

### A0. Suporte Completo a Partidas de Duplas (Doubles) ✅
- **Status:** Concluída (2026-10-22)
- **DoD:** Implementação pura de regras ITF de duplas (`src/core/scoring/doubles.ts`), persistência e migrations no Prisma (`matchType`, `player1PartnerId`, `player2PartnerId`, `doublesSetup`), endpoints de pontuação e arranjo de sacador/devolvedor (`/arrangement`), formulário de criação com seleção de 4 atletas e wizard de setup, tela `/scoring` com indicação de sacador ativo e devolvedor, `PointDetailsModal` com seleção de quem bateu e escolha de lado no deuce no-ad, ajuste de formação entre sets (`DoublesArrangementModal`), modal Editar Placar preservando duplas, timeline, relatório e dashboard. 100% retrocompatível com simples, sem testes ignorados e zero erros no `tsc --noEmit`.

### A0.1. Estatísticas Avançadas & Alinhamento à Planilha ITF/ATP ✅
- **Status:** Concluída (2026-10-25)
- **Documento:** `docs/archive/Plano – Estatísticas Avançadas.md`
- **DoD:** 100% das 5 fases concluídas: (i) Fase 1 com 15 correções estruturais (ralis ATP/ITF, Ace/DF desvinculados de rali, Game/Set points por atleta e dinâmicos por formato, Ponto Decisivo No-Ad duplo e break point para devolvedor, subidas e passadas bilaterais, breakdown com tiebreak e p2Games, momentum estendido, jogos completos protegidos, CSV e unificação de set summary); (ii) Fase 2 com as 9 seções da planilha (1. Saque, 2. Devolução com retorno em quadra e sem DF, 3. Fundo de Quadra por ralis, 4. Rally, 5. Rede e Passada, 6. Pontos de Pressão, 7. Definição do Ponto sem Ace/DF, 8. Matriz de 12 Golpes, 9. Momentum); (iii) Fase 3 com tempos total e efetivo (`MAX_GAP_SECONDS = 90`, descartando pausas >90s e transições de set); (iv) Fase 4 com cabeçalho superior completo de metadados, clima e tempos; (v) Fase 5 com desdobramento individual por atleta em duplas (`serverId`, `hitterId`, `courtSide`). 100% STE-DEV R-03 (módulos ≤ 100 linhas). `typecheck` 0 erros, `lint` 0 issues, `test:design` 3/3 (26/26), `test:strict` 356/356 suites verdes (3.468 testes).

### A0.2. Aproach FH / BH e Efeito em Detalhes do Ponto ✅
- **Status:** Concluída (2026-10-25)
- **DoD:** Inclusão de `approach_fh` ("Aproach FH") e `approach_bh` ("Aproach BH") em `RallyGolpeSchema` e `GOLPE_LABELS`. Disponibilizados na cascata de `PointDetailsModal` em: (a) `passada > erro_forcado`, e (b) `rede > winner`. Em `rede > winner`, `shouldShowEfeito` exibe dinamicamente o efeito (`topspin`, `slice`, `flat`) quando o golpe escolhido for um aproach (mantendo oculto para voleios diretos). Classificação e matriz de golpes atribuem aproachs à linha correspondente e lado de forehand/backhand. 100% STE-DEV R-03 (≤ 100 linhas). Testes unitários e integração 100% verdes (356/356 suites, 3.473 testes).

### A0.3. Otimização de Duração do Rallye nos Detalhes do Ponto ✅
- **Status:** Concluída (2026-10-25)
- **DoD:** Remoção da opção redundante `1-4 bolas` (`opcao_1`) das pills de `Duração do Rallye` no modal `PointDetailsModal` (`DURACAO_OPTIONS`), disponibilizando apenas `5-8 bolas` e `+9 bolas`. Qualquer ponto sem indicação explícita segue o padrão canônico de rali curto (`1-4 bolas`). Habilitado toggle/desmarcação para voltar ao padrão com um segundo toque. Retrocompatibilidade total preservada para pontos históricos. 100% STE-DEV R-03 (≤ 100 linhas). 356/356 suites e 3.474 testes verdes.

### A0.4. Registro e Resumo de Break Point e Game Point em 40/40 no modo No-Ad ✅
- **Status:** Concluída (2026-10-25)
- **DoD:** Correção do registro e cômputo estatístico no ponto decisivo (40/40) em formatos No-Ad (`BEST_OF_3_NO_AD` e `SHORT_SET_2V2_NO_AD`): `point-ball-context.logic.ts` com `isGameBall` e `isBreakPoint` retornando `true`; propagação de `format` em `derivePointSnapshot` e `enrichPointsFromHistory`, atribuindo `isBreakPoint: true` (para o devolvedor) e `isGameBall: true` (para ambos); propagação de `format` para `computeLiveCounters` e `computeAdvancedStats`, exibindo imediatamente no card de 'Estatísticas ao Vivo' e no 'Resumo do Set'; fallbacks em `return-stats.ts`, `serve-stats.ts`, `set-summary-service.logic.ts` e `timeline-rebuild.ts`. 100% STE-DEV R-03 (≤ 100 linhas). 357/357 suites e 3.482 testes verdes.

### A0.5. Remediação de Acesso, Segurança e Consistência Funcional ✅
- **Status:** Concluída (2026-10-26)
- **Documento:** `docs/archive/PLANO_REMEDIACAO_ACESSO_E_SEGURANCA.md`
- **Fase 0 (Estancamento Crítico & Desbloqueio P0/P1):**
  - `src/middleware.ts`: liberação pública de `/api/auth/signup`, `/api/auth/forgot` e `/api/auth/reset-password`.
  - `POST /api/support/password-resets/[id]/issue` e `GET /api/support/password-resets`: blindadas com `withAccessHandler('support:account:assist')`, proteção contra alvos ADMIN/SUPORTE e gravação em `auditLog`.
  - `POST /api/memberships` e `GET /api/memberships`: blindadas com validação de escopo de CT/plataforma (`platform:memberships:manage` / `ct:members:manage`) e auditoria.
  - `GET /api/users/[id]/export`: restrito a titular ou ADMIN e exclusão de hashes de senha (`passwordHash`, `resetTokenHash`).
  - `POST /api/users/[id]/anonymize`: blindado com permissão de plataforma/titular, anonimização real de PII (email, cpf) e revogação de sessão (`bumpSessionVersion`).
  - `POST /api/users/[id]/revoke-sessions` e `PATCH /api/users/[id]/operate`: blindadas com `platform:users:manage` e titular.
  - `POST /api/support/athlete-claims/[id]/decide` e `GET /api/support/athlete-claims`: protegidas com `support:account:assist`, uso estrito do `user.id` autenticado e auditoria.
- **Fase 1 (Restauração da API de Atletas /api/players):**
  - Restauração de `GET` e `POST` em `/api/players` e `GET`, `PUT`, `DELETE` em `/api/players/[id]` conectando os módulos `player-put.logic.ts` e `player-delete.logic.ts`.
  - 100% dos testes de `/api/players` recuperados (55/55 testes passando).
- **Fase 2 (Unificação de Papéis e Contexto de Operação):**
  - ADMIN conciliado em `accessService.ts` e `access-actor.logic.ts` com papel `PLATAFORMA/ADMIN`.
  - Geração de token com `deriveLegacyRole` sincronizada com memberships.
  - Fallbacks de Actor e resiliência em `accessService.ts` e `match-access-service.ts`.
  - 100% dos testes de `/api/matches` verdes (36/36 suítes, 214 testes).
- **Fase 3 (Blindagem das 31 Rotas Scaffold com withAccessHandler):**
  - Lote A: `/api/training-centers` (`platform:ct:manage`), `/api/clubs` (`athlete:create`), `/api/link-invites` (`ct:members:manage`) e `/api/invites/accept` (autenticação do aceitante e validação de `codeHash`).
  - Lote B: `/api/players/merge` (`platform:player:merge` + `auditLog`) e `/api/players/provisional` (`athlete:create`).
  - Lote C: `/api/guardians/link` (`guardian:link`), confirmação de vínculo em `/api/guardians/link/[id]/confirm`, revogação em `/api/guardians/link/[id]`, registro de consentimento em `/api/consents` e revogação em `/api/consents/[id]`.
- **Fase 4 (Integridade de Dados e Menores):**
  - Migration `20261026030000_unique_coach_avulso`: índice parcial de unicidade para treinadores avulsos (`WHERE ctId IS NULL AND status = 'ACTIVE' AND kind = 'TREINADOR'`).
  - Proteção de dados de menores em conformidade com ECA/LGPD.
- **Fase 5 (UI/UX e Telas):**
  - Tela de login atualizada com links de cadastro e recuperação de senha.
  - Novas telas `/signup` e `/forgot` criadas com feedback interativo e modularizadas (<100 linhas).
  - Hook client-side `useAccess` implementado e coberto com testes unitários em jsdom.
- **Garantias de Engenharia:**
  - `pnpm run check:r03`: 0 violações, 0 regressões em 877 arquivos.
  - `pnpm run typecheck`: 0 erros no `tsc --noEmit`.


### A0.6. Menus por Perfil e Pool de Ecossistema ✅
- **Status:** Concluída (2026-10-29) — Consolidada nas Ondas 1 e 2 do `PLANO_EXECUCAO_UNIFICADA.md`
- **Documento:** `docs/PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md`
- **Decisões:** ADR-0008 (Pool) e ADR-0009 (Menu por vínculo) em `docs/ARCHITECTURE.md`; regras de perfis em `docs/PRD.md` §3.1.
- [x] **F0** — ADRs, regras no PRD, contratos planejados em `src/app/api/CONTRACTS.md` §7.1 e itens de backlog.
- [x] **F1** — `/api/auth/me` aditivo (`athlete`, `coach`, `canOperate`, `isSuporte`, `isAdmin`) + função pura `buildMenu` (`src/core/access/menu.ts`) com 14 casos de teste.
- [x] **F2** — Sidebar por seções (itens "Em breve"), layout compartilhado (`DashboardChrome`), login redirecionando por perfil, "Aguardando" fora do menu.
- [x] **F3** — Escopo de dados por vínculo (partidas/atletas); autorização fail-closed em `canReadMatch`/`canAnnotateMatch`.
- [x] **F4** — Treinador avulso cria atleta com login; atleta resgata convite de clube; desvínculo pelo gestor/Suporte.
- [x] **F5** — Telas: Gestor (abas funcionais, emissão de links) e Suporte (Solicitações, Auditoria, Aprovação/Suspensão).
- [x] **F6** — Pool: RLS das tabelas de vínculo, integridade referencial, preservação de histórico na troca de clube.
- [x] **F7** — Testes estritos verdes (397 suítes, 3910 testes).

### A0.7. Edição de Clubes, Gestores, Dados do CT e Gestão de Treinadores e Atletas ✅
- **Status:** Concluída (2026-10-29) — Consolidada na Onda 2 do `PLANO_EXECUCAO_UNIFICADA.md`
- **Documento:** `docs/PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md`
- **Frentes de Trabalho:**
  - [x] **F1: Suporte — Edição de Clubes e CTs Ativos:** Botão "Editar" ativo em `clubes-section.tsx` para clubes ativos; abertura de `EditarClubeModal`; retorno de campos cadastrais em `GET /api/training-centers` e flexibilização de `address` em `PATCH /api/training-centers/[id]`.
  - [x] **F2: Suporte — Edição de Gestores & RBAC:** Correção de autorização (`platform:users:manage` para perfil `SUPORTE` em `profile-matrix.ts`); prevenção de erro de montagem em `EditarGestorModal` com `key` e renderização condicional.
  - [x] **F3: Gestor — Dados do Clube:** Criação de `GET` e `PATCH /api/gestor/club` (com CNPJ bloqueado para edição); exibição dos dados reais da PJ e representante em `club-info.tsx`; conexão ao modal `EditarClubeModalGestor`.
  - [x] **F4: Gestor — Treinadores e Atletas:** Modal unificado de cadastro com seleção de tipo (Treinador/Atleta) com campos: Nome, CPF, Data de Nascimento e Tipo; botões de edição de linha e controle de seleção por linha nas tabelas de treinadores e atletas; endpoints `PATCH /api/gestor/coaches/[id]` e `PATCH /api/gestor/athletes/[id]`.


### A0.3. Enriquecimento de Perfis: Gestor, Suporte & Menus Dinâmicos ✅
- **Status:** Concluída (2026-10-27)
- **DoD:**
  - **Gestor:** Reset de senhas com modal de link (`LinkCopyModal`), edição de dados de atletas e treinadores (`EditarAtletaModal`, `EditarTreinadorModal`), e visualização de partidas do clube (`GET /api/gestor/matches`, `ClubMatchesTable`, aba no `TabNav` e contadores no dashboard).
  - **Suporte:** Ciclo de vida de clubes completo (`PENDING` -> `ACTIVE` -> `SUSPENDED` -> `ACTIVE`), bloqueio e desbloqueio, edição de clubes, reset direto de senha de gestores (`POST /api/support/password-resets`), revogação de sessões ativas (`revoke-sessions`), proteção de contas privilegiadas e auditoria.
  - **Menus Dinâmicos & Rotas:** Menus laterais gerados dinamicamente via `buildMenu` e `mapMenuSectionsToSidebar`, rotas mapeadas diretamente para as abas ativas do Gestor e Suporte, route guards por perfil em middleware para `/admin`, `/suporte` e `/gestor`, correção do contraste no Admin Dashboard (`admin-users-table.tsx` e `admin-dashboard-chrome.tsx`) e sincronização de perfis no backend. 100% dos testes unitários e de integração verdes.

### A0.3b. Refinamentos do PLANO_ALTERACOES_RKT_2026-10-27.md ✅
- **Status:** Concluída (2026-10-28)
- **Documento:** `docs/PLANO_ALTERACOES_RKT_2026-10-27.md`
- **DoD:** 5 fases executadas integralmente: (1) Nova partida — rótulos simples/duplas sem "1 vs 1"/"2 vs 2", DateTimeSection sem aviso nem asterisco, Data opcional, `scheduledAt` indefinido sem data, preenchimento com hoje ao entrar em `IN_PROGRESS`; (2) Duplicidade — `findDuplicateMatch` com `matchType` e parceiros, duplas como conjuntos de lados (qualquer ordem), simples nunca colide com dupla, chave de advisory lock atualizada, `DuplicateMatchModal` com tipo/data/"no mesmo dia"; (3) Nomes de dupla — utilitário `abbreviateDoublesName`, `PlayerCard` em uma linha, `ScoreboardCard`/`ScoreboardPlayerRow` com parceiros e truncate+title; (4) Card do dashboard — regra do sobrescrito de tiebreak unificada (vencedor só games, perdedor com sobrescrito dos pontos do TB; Match TB só o placar), `BEST_OF_5` → Set 1-4 e TB, `MatchCard` reescrito sobre estrutura do `ScoreboardCard` com cores de quadra, suspenso, nomes de dupla abreviados, sem pontos do game; (5) Estatísticas avançadas — `BaselineStats` com won/total por faixa de rali (Curtos 1-4, Médios 5-8, Longos 9+), seção de fundo com "Aproveitamento/Total (x/y)", rótulos de rali corrigidos em rally e shot sections, `approach_fh`/`approach_bh` separados na matriz de golpes, Momentum com sequências exatas de 2/3/4+ por jogador, Breakdown por Set com tempo total do jogo. `typecheck` 0 erros · `spec:validate` sem drift · `test:design` 3/3 (26/26) · `test` 397/397 suítes e 3904/3904 testes verdes.

### A0.3c. Alinhamento ao Design System Stitch (Court Precision Tech): Admin, Gestor e Treinador ✅
- **Status:** Concluída (2026-10-28)
- **Origem:** Auditoria com MCP Stitch (`projects/1329349350691583873` — *Court Precision Tech*) e diretrizes de segregação de personas (Treinador vs Atleta).
- **DoD:**
  - **Perfil Treinador:** Segregação estrita em relação ao perfil Atleta e ao perfil Anotador. Itens de menu ainda sem tela dedicada no Next.js (`treinador-atletas`, `treinador-solicitacoes`, `treinador-relatorios`) configurados via `soon(...)` com `disabled: true` e `badge: 'Em breve'`, eliminando links para rota 404 sem desviar para `/atletas` genérico.
  - **Perfil Admin:** Correção do bug de opacidade em containers (`opacity-20` no elemento header e cards migrados para opacidade de borda Tailwind `border-telemetry-border/20`), saneamento do alerta de erro para `telemetry-error` e migração dos badges de perfil de classes arbitrárias (`purple-100`, etc.) para tokens de telemetria semânticos (`bg-telemetry-alert/20`, `bg-telemetry-blue/20`, etc.).
  - **Perfil Gestor:** Correção de acessibilidade WCAG no botão Novo Atleta (`bg-telemetry-volt text-white` → `text-black font-bold`). Saneamento completo de classes legadas (`sky-*`, `gray-*`) e adequação de todos os modais para Level 3 do Stitch (`bg-telemetry-card`, `border-telemetry-border/20`, `text-telemetry-text-primary`, `backdrop-blur-sm`).
  - **Qualidade e Estabilidade:** 100% STE-DEV R-03 (0 violações em 992 arquivos), `typecheck` 0 erros, `test:design` 3/3 (26/26) e testes unitários/integração verdes.

### A0.4. Tratamento e Mensagens de Erro Amigáveis (UX) & Qualidade ✅
- **Status:** Concluída (2026-10-29) — Onda 4 do `PLANO_EXECUCAO_UNIFICADA.md`
- **Documento:** `docs/PLANO_TRATAMENTO_E_MENSAGENS_DE_ERRO_UX_2026-10-27.md` / `docs/PLANO_EXECUCAO_UNIFICADA.md`
- **DoD:**
  - Extração de mensagens em linguagem humana para validações Zod no backend (`formatZodMessage` em `src/lib/api-response.logic.ts`).
  - Extrator universal de mensagens de erro no frontend (`extractErrorMessage` em `src/lib/error-parser.ts`).
  - Eliminação de `window.alert()` em código de produção, substituído por `useToast()`.
  - Feedback visual por campo em modais de cadastro e edição.
  - Saneamento de chamadas `console.*` de produção para `logger.*`.
  - Otimização do polling do painel de anotação com pausa quando a aba estiver oculta (`visibilityState === 'hidden'`).
  - R-03 100% verde (0 violações, 0 regressões) e suíte estrita verde (397 suítes, 3910 testes).

### A0.5. Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade ✅
- **Status:** Concluído (2026-10-27)
- **Documento:** `docs/PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md`
- **DoD:**
  - **Fase 0:** Testes de Caracterização para travar comportamento de signup, players e claims. ✅
  - **Fase 1:** Correção Imediata de Segurança: proteger `POST /api/athlete-claims` (P1) e corrigir `User.cpf` corrompido com e-mail em `/signup` (P6) + sanitização. ✅
  - **Fase 2:** Migrations e Core Criptográfico: `Player.cpfHash` (HMAC), `Player.cpfLast2`, `Club.ctId`, geração segura de `athleteCode` e regras de desduplicação pura. ✅
  - **Fase 3:** Busca no Pool com Minimização de Dados: endpoint e filtros por escopo, omitindo dados sensíveis e mascarando menores. ✅
  - **Fase 4:** Cadastro Rápido e Modos de Cadastro (com Login vs Provisório, toggle "Meu clube", criação de `PlayerCT`). ✅
  - **Fase 5:** Claim Automático no `/signup` para atletas provisórios N0/N1 existentes com validação de maioridade. ✅
  - **Fase 6:** Sincronização e Unificação de Clubes e CTs (`Club.ctId`). ✅
  - **Fase 7:** Frontend: Toggle "Meu clube" na Nova Partida, modais atualizados e sincronização offline. ✅
  - **Fase 8:** Suporte e Resolução de Conflitos: fila de claims e merge de atletas com trilha de auditoria. ✅
  - **Fase 9 & 10:** Bateria de Testes Strict/A11y/Coverage e Documentação Técnica (ADR-0010/ADR-0011). ✅

### A0.6. Correção de Roteamento por Perfil, Autorização de Partidas e Inconsistências ✅
- **Status:** Concluído (2026-10-29) — Onda 1 do `PLANO_EXECUCAO_UNIFICADA.md`
- **Documento:** `docs/PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md` / `docs/PLANO_EXECUCAO_UNIFICADA.md`
- **DoD:**
  - **Etapa 1:** Segurança Crítica e Autorização de Partidas (comparação correta de Player.id com `athletePlayerId`, autorização fail-closed, unificação em `canReadMatch`/`canAnnotateMatch`, links em `club-matches-table` apontando para `/match/[id]/report` ou `/scoring`). ✅
  - **Etapa 2:** Roteamento Canônico, Home por Perfil e Middleware (funções puras `homeForProfile` e `homeForProfileString`, middleware redirecionando usuários autenticados em `/login` de acordo com seu perfil canônico sem dead code, devolução de `mustChangePassword` na raiz do payload de `POST /api/auth/login`). ✅
  - **Etapa 3:** Layout Compartilhado e Navegação por Perfil (`DashboardChrome` unificado com sidebar e topbar responsivos em `/dashboard`, `/gestor`, `/suporte` e `/admin`, itens sem tela desabilitados com badge 'Em breve', botão voltar dinâmico). ✅
  - **Etapa 4:** Adequação ao Design System (`telemetry-*`) em todas as páginas e modais de `/gestor` e `/suporte`, zero classes Tailwind legadas `bg-gray-*`/`bg-sky-*`/`bg-white`, `useAccess` descontinuado. ✅

### A0.7. Acompanhamento de Partidas ao Vivo (Transmissão de Partidas) ✅
- **Status:** Concluído (2026-10-29)
- **Documento:** `docs/PLANO_ACOMPANHAMENTO_PARTIDAS_AO_VIVO_2026-10-29.md`
- **DoD:**
  - **Domínio Puro (`src/core/spectate/`):** Cálculo determinístico de status de sinal (`signal-status.ts`), ritmo de jogo e polling adaptativo (`rhythm-status.ts`), detecção transparente de desfazimentos de pontos e ajustes manuais (`correction-diff.ts`), e projeção de lista-branca com mascaramento de menores de idade (`spectator-projection.ts`). ✅
  - **Banco de Dados (Prisma):** Migração aditiva `20261029090000_add_match_spectating` criando `MatchShareLink` (token hash SHA-256), `MatchSpectator` (concessão de acompanhante por partida), `PointLog.receivedAt`, `PointLog.updatedAt`, `MatchAnnotationSession.lastHeartbeatAt` e enum `ConsentPurpose.BROADCAST`. ✅
  - **Serviços & Infraestrutura Econômica:** Criptografia de tokens (`src/lib/spectate-token.ts`), pré-checagem barata Passo 0 no Postgres (<150 bytes, evitando estouro de egress do Neon), APIs REST de compartilhamento, resgate (`/api/spectate/redeem`), feed sincronizado (`/api/spectate/[matchId]/feed`) e heartbeat (`/api/matches/[id]/sessions/[sessionId]/heartbeat`). ✅
  - **Presença do Anotador:** Hook `useAnnotatorHeartbeat` disparando a cada 20s, pausado com aba oculta/offline e throttle de 15s no servidor. ✅
  - **Interface Mobile-First (360px):** Resgate de convite seguro `/matches/convite/[token]`, redirecionamento com suporte a `next` seguro no login e middleware, tela de acompanhamento `/matches/acompanhar/[matchId]` com Scoreboard adaptado, faixa de último ponto com ritmo de jogo simplificado, abas de Pontos e Resumo, e modal `ShareSpectateModal` no menu. ✅
  - **Qualidade e Estabilidade:** 100% STE-DEV R-03 (0 violações em 1026 arquivos), `typecheck` 0 erros, `test:design` 3/3 (26/26), `test:components` 98/98 (1.087/1.087) e bateria completa de testes de domínio e serviços verdes. ✅

### A1. Página de Estatísticas do Jogador 🔴
- **Status:** Não iniciada
- **Rota:** `/players/[id]/stats`
- **DoD:** Exibir histórico de partidas, médias de pontos e métricas de saque.

### A2. Exportação de Dados (PDF/Excel) 🔴
- **Status:** Não iniciada
- **Contexto:** Requisito do PRD não implementado
- **DoD:** Exportar relatórios de partidas e estatísticas em PDF e Excel

### A3. Funcionalidade de Áudio Otimizada 🔴
- **Status:** Refatorada (Fase 4.2 concluída)
- **Contexto:** Migramos o áudio do PointLog.
- **DoD:** Testar a exibição da nota de áudio isoladamente no dashboard e otimizar fetch.

### A4. Filtros Avançados (Partidas/Jogadores) ⏳
- **Status:** Parcial (filtro básico existe)
- **DoD:** Filtros por data, clube, estatísticas, status da partida

### A5. Modo Offline (Service Worker) 🟢
- **Status:** Em aprimoramento contínuo
- **Decisão:** O IndexedDB já cuida do enfileiramento, focar agora na sincronização sem atritos (Fila de Requests).

### A6. Sistema de Permissões Granulares 🟢
- **Status:** Refatorado (Fase 3 concluída)
- **Contexto:** Removidos roles fantasmas (GESTOR/COACH). Foco absoluto em ADMIN e ANNOTATOR.
- **DoD:** Manter simplicidade. No futuro, avaliar se precisaremos expandir a modelagem.

---

## 3. Débito Técnico Arquitetural

### TD-056. Desacoplamento de history em Match.scoreState e Eliminação do Custo Quadrático ✅
- **Status:** Concluído (2026-10-08)
- **Contexto:** `POST /point` serializava e regravava o envelope com histórico acumulado a cada ponto, gerando custo quadrático de dados e processamento no PostgreSQL.
- **Implementado:** Snapshot enxuto no `POST /point` (`{ state: newState, history: [] }`), correção atômica de Undo sincronizando anulação de `PointLog` (`voidLastPoint`/`isUndo`), script de backfill idempotente para tiebreaks legados (`scripts/backfill-tiebreak-scores.ts`), motor e script de Shadow Mode (`src/core/scoring/shadow-replay.ts` e `scripts/shadow-replay-validator.ts`), e reidratação de badges no `GET /matches/[id]` via `recentWinnerIds`.

### A8. Separar lógica de negócio dos componentes React ⏳
- **Prioridade:** Alta
- **Contexto:** Componentes com 300+ linhas misturando UI e lógica
- **DoD:** Camada de serviços/hooks customizados extraída

### A9. Implementar tratamento de erro global ✅
- **Prioridade:** Alta
- **Status:** Concluído no core da aplicação (2026-07-20 / Onda 1 Guardrails)
- **Implementado:** `handleApiError` (`src/lib/api-helpers.ts`), hierarquia tipada de `ApiError` (`src/lib/errors.ts`) cobrindo 100% das APIs (18+ rotas), além de `src/app/error.tsx` e `src/app/global-error.tsx`.
- **Pendência residual:** Integração com APM externo (Sentry) rastreada em TD-022.

### A10. Adicionar loading states consistentes 🔴
- **Prioridade:** Média
- **Contexto:** Algumas telas sem feedback visual durante requests
- **DoD:** Skeleton loaders em todas as telas de dados

### A11. Refatorar `MatchProvider` (200+ linhas) ⏳
- **Prioridade:** Média
- **Contexto:** Context com múltiplas responsabilidades
- **DoD:** Separar em sub-contexts (scoreboard, timeline, players)

### A12. Implementar versionamento de API ⏳
- **Prioridade:** Baixa
- **Contexto:** Rotas API sem versionamento (`/api/v1/...`)
- **DoD:** Prefixo v1 + estratégia de deprecação documentada

### A13. Migrar de CSS Modules para Tailwind puro 🔴
- **Status:** Híbrido (alguns componentes ainda usam `.module.css`)
- **DoD:** Remover todos os arquivos `.module.css`

---

### TD-057. Fundação de acesso — pendências da Fase 1A (PLANO_FUNDACAO_PERFIS_v2)
- [x] **RESOLVIDO** `match.player1Id === currentUserId` nas rotas de partida: substituído por `actor.athletePlayerId` (resolvido via `Player.userId === currentUserId`).
- [ ] RLS das tabelas novas (`memberships`, `training_centers`, `player_cts`, `guardian_links`, `consent_records`, `athlete_claims`, `link_invites`, `password_reset_requests`, `audit_logs`) ainda **não** habilitado — adicionar no padrão `20261022000000_add_rls_policies` na Fase 1B.
- [ ] `User.cpf` continua obrigatório; torná-lo opcional (UNIQUE com vários NULL) na Fase 1B junto com o auto-cadastro, ajustando `schemas/user.ts`, `adminService` e telas.
- [ ] Token legado sem `sv` (emitido antes do deploy) continua válido e o `refresh` não o promove; passa a ter `sv` no próximo login. Avaliar forçar novo login após o deploy.
- [ ] Onda 0 parcial: `login`/`refresh` já emitem/propagam `sv` e `me` herda o guarda com `sv`; o claim derivado (`deriveLegacyRole`) só entra no `login` na Fase 1B, quando existirem contas sem claim legado.
- [ ] Rotas de leitura (admin/users, players, matches) ainda **não** migradas para `withAccessHandler` — ondas seguintes.
- [ ] `athleteCode` (geração + backfill), mesclagem, reivindicação e `PlayerCT` na Fase 1C.
- [ ] Quando recibos/cobrança (Fase 4) entrarem, e-mail transacional provavelmente será exigido.
- [ ] Transmissão ao vivo adiada: ao implementá-la voltam F10/F11/§11, consentimento `BROADCAST` (`ALTER TYPE "ConsentPurpose" ADD VALUE`), limite de espectadores e o cache/egress do feed.
- [ ] Áudios como `Bytes` no Postgres são o maior risco do 1 GB do Neon (independe da fundação).

---

## 4. Refatoração e Limpeza

### R1. Remover comentários de código morto ✅
- **Arquivos:** `MatchCard.tsx`, `PlayerForm.tsx`, `ScoreboardDisplay.tsx`
- **Estimativa:** 1h

### R2. Consolidar utilitários duplicados ⏳
- **Contexto:** Funções de formatação de data/hora espalhadas em 5 arquivos
- **DoD:** Centralizar em `src/lib/utils/datetime.ts`

### R3. Renomear variáveis de estado inconsistentes ⏳
- **Exemplos:** `isOpen` vs `open`, `isLoading` vs `loading`
- **DoD:** Seguir convenção única (`is*` para booleans)

### R4. Extrair constantes mágicas ⏳
- **Contexto:** Números hardcoded (ex: `timeout: 5000`, `maxPlayers: 15`)
- **DoD:** Mover para `src/config/constants.ts`

### R5. Remover imports não utilizados ✅
- **Contexto:** ESLint detecta mas não corrige automaticamente
- **Comando:** `pnpm lint --fix`

### R6. Padronizar nomes de props de componentes ⏳
- **Contexto:** Alguns usam `onClick`, outros `onPress`, outros `handleClick`
- **DoD:** Seguir convenção React padrão (`on*` para callbacks)

### R7. Simplificar condicionais aninhadas ⏳
- **Arquivos:** `ScoringPanel.tsx` (5 níveis de `if`), `MatchTimeline.tsx`
- **DoD:** Refatorar para early returns ou guard clauses

### R8. Remover `console.log` de produção ✅
- **Contexto:** 47 ocorrências em código de produção
- **DoD:** Substituir por logger apropriado ou remover

### R9. Consolidar tipos TypeScript duplicados ⏳
- **Contexto:** `Match`, `MatchData`, `MatchDTO` coexistem
- **DoD:** Tipo canônico único + aliases quando necessário

### R10. Remover arquivos `.test.skip.ts` ⏳
- **Contexto:** Testes desabilitados acumulando
- **DoD:** Corrigir e habilitar ou documentar por que skip

### R11. Limpar diretórios vazios ✅
- **Pastas:** `src/app/telemetry/`, `src/components/ui/`, `src/components/telemetry/`, `src/test/`
- **Comando:** Script de cleanup já remove

---

## 5. Débito Técnico (50 itens do TECH_DEBT.md)

### 5.1 Segurança e Autenticação (Prioridade: Crítica)

#### TD-001. Implementar CSRF protection em forms 🔴
- **Risco:** Alto
- **Impacto:** Vulnerabilidade a ataques CSRF
- **Solução:** Tokens CSRF em todos os formulários POST/PUT/DELETE

#### TD-002. Adicionar rate limiting nas rotas de API 🔴
- **Risco:** Alto
- **Impacto:** Vulnerável a DDoS e abuso
- **Solução:** Middleware com `@upstash/ratelimit` ou similar

#### TD-003. Modelo de Isolamento Multi-tenant e RLS no Neon 🟢
- **Status:** Resolvido / Conforme arquitetura.
- **Decisão:** A segurança e o isolamento multi-tenant são garantidos integralmente na camada de aplicação via `withRLSHandler`, `withPermissionHandler` e filtros estritos de ownership/tenant em todas as rotas e services.
- **Otimização:** Em conformidade com o ambiente Serverless/Free Tier (Vercel + Neon Pooler), o middleware redundante de `set_config` no Prisma foi removido de `src/lib/prisma.ts`, eliminando round-trips duplicados e prevenindo riscos de timeout (10s) e esgotamento do pooler. A conexão de produção mantém a role padrão `neondb_owner`, dispensando overhead de transações RLS no banco em queries de leitura.


#### TD-004. Implementar rotação de secrets/tokens ⏳
- **Risco:** Médio
- **Impacto:** Tokens de longa duração aumentam risco de comprometimento
- **Solução:** Política de rotação automática + vault

#### TD-005. Adicionar Content Security Policy headers 🔴
- **Risco:** Médio
- **Impacto:** XSS, clickjacking
- **Solução:** CSP headers em `next.config.js`

### 5.2 Performance e Otimização (Prioridade: Alta)

#### TD-006. Completar paginação por cursor em endpoints de listagem ⏳
- **Risco:** Médio
- **Status:** Parcial (rotas principais concluídas)
- **Implementado:** Paginação por cursor via Zod (`cursor`, `limit` max 100) e envelope `{ data: { [items], nextCursor } }` em `GET /api/matches`, `GET /api/players` e `GET /api/admin/users`.
- **Pendência:** Adicionar paginação nos endpoints secundários:
  - `GET /api/matches/suspended-sessions`
  - `GET /api/matches/tournament-suggestions`

#### TD-007. Adicionar cache de queries frequentes ⏳
- **Risco:** Baixo
- **Impacto:** Latência alta em dashboards
- **Solução:** React Query com staleTime configurado

#### TD-008. Otimizar bundle size (atualmente ~800KB) ⏳
- **Risco:** Baixo
- **Impacto:** FCP/LCP ruins em conexões lentas
- **Solução:** Code splitting, dynamic imports, tree shaking

#### TD-009. Implementar imagens otimizadas (Next.js Image) ⏳
- **Contexto:** Algumas imagens ainda usam `<img>` raw
- **Solução:** Migrar para `next/image` com loading lazy

#### TD-010. Adicionar service worker para cache estático 🔴
- **Contexto:** PWA foi removido
- **Decisão:** Reavaliar com usuários reais

### 5.3 Qualidade de Código (Prioridade: Média)

#### TD-011. Aumentar cobertura de testes unitários (atual: ~40%) ⏳
- **Meta:** >70% coverage em `src/lib/` e `src/hooks/`
- **Prioridade:** Funções de cálculo de estatísticas primeiro

#### TD-012. Adicionar testes E2E para fluxos críticos 🔴
- **Fluxos:** Login → Criar partida → Anotar evento → Finalizar
- **Ferramenta:** Playwright (já configurado)

#### TD-013. Implementar testes de acessibilidade automatizados ⏳
- **Ferramenta:** axe-core ou jest-axe
- **Meta:** Zero violações WCAG AA

#### TD-014. Adicionar validação de schemas Zod nas APIs restantes ⏳
- **Contexto:** Parte das rotas de API já foi migrada para `validatedRequest(request, Schema)` com Zod (`src/schemas/contracts.ts`), mas endpoints operacionais ainda possuem validações manuais.
- **Concluídas:** `POST /api/players`, `GET /api/players`, `POST /api/admin/users`, `POST /api/matches`, `POST /api/auth/login`.
- **APIs Pendentes (DoD):**
  - `POST /api/matches/[id]/point` (Prioridade: Média)
  - `POST /api/matches/[id]/finish` (Prioridade: Média)
  - `PATCH /api/matches/[id]/state` (Prioridade: Média)
  - `POST /api/matches/[id]/sessions` (Prioridade: Baixa)
  - `POST /api/matches/[id]/sessions/:sessionId/endorse` (Prioridade: Baixa)
  - `POST /api/matches/[id]/sessions/:sessionId/abandon` (Prioridade: Baixa)
  - `GET /api/matches/suspended-sessions` (Prioridade: Baixa)
  - `GET /api/matches/tournament-suggestions` (Prioridade: Baixa)

#### TD-015. Documentar decisões arquiteturais (ADRs) ✅
- **Status:** Concluído
- **Decisão:** ADRs consolidadas diretamente na fonte única da verdade em `docs/ARCHITECTURE.md` §6.

### 5.4 UX e Acessibilidade (Prioridade: Média)

#### TD-016. Adicionar feedback visual em ações assíncronas 🔴
- **Contexto:** Botões sem loading state
- **Solução:** Spinner/disabled durante requests

#### TD-017. Implementar modo escuro completo ⏳
- **Contexto:** Tokens de cor existem mas alguns componentes não respeitam
- **Solução:** Auditoria + correção de cores hardcoded

#### TD-018. Melhorar mensagens de erro para usuários ⏳
- **Contexto:** Erros técnicos expostos ("FK constraint failed")
- **Solução:** Mapeamento de erros para mensagens amigáveis

#### TD-019. Adicionar estados vazios em listas ⏳
- **Contexto:** Telas vazias sem orientação
- **Solução:** Empty states com call-to-action

#### TD-020. Implementar keyboard navigation completa ⏳
- **Contexto:** Alguns componentes não navegáveis por teclado
- **Meta:** Todas as ações acessíveis via Tab/Enter/Escape

### 5.5 Infraestrutura e DevOps (Prioridade: Baixa)

#### TD-021. Configurar CI/CD completo ⏳
- **Contexto:** GitHub Actions existe mas incompleto
- **Faltando:** Deploy automático, testes E2E no CI

#### TD-022. Adicionar monitoring e observability 🔴
- **Contexto:** Sem logs centralizados ou métricas
- **Solução:** Sentry (erros) + Vercel Analytics (performance)

#### TD-024. Adicionar health checks nas APIs 🔴
- **Contexto:** Sem endpoint `/health` ou `/ready`
- **Solução:** Rota que verifica DB + serviços externos

#### TD-025. Configurar ambientes de staging 🔴
- **Contexto:** Deploy direto para produção
- **Solução:** Preview deployments (Vercel já oferece)

### 5.6 Manutenibilidade (Prioridade: Baixa)

#### TD-026. Adicionar changelog automático ⏳
- **Ferramenta:** conventional-changelog
- **Gatilho:** Release tags

#### TD-027. Documentar setup de desenvolvimento ⏳
- **Contexto:** README básico sem troubleshooting
- **Necessário:** Guia de primeiro setup, requisitos, FAQ

#### TD-028. Criar scripts de seed para desenvolvimento 🔴
- **Contexto:** Desenvolvedores criam dados manualmente
- **Solução:** `pnpm db:seed` com dados fake realistas

#### TD-029. Adicionar linting de commits (commitlint) ⏳
- **Contexto:** Mensagens de commit inconsistentes
- **Solução:** Husky + commitlint (Husky não está configurado ainda)

#### TD-030. Implementar pre-commit hooks ⏳
- **Contexto:** Código não-lintado chega no Git
- **Solução:** lint-staged + Husky (requer configuração de `.husky/`)

### 5.7 Itens Rápidos (<2h cada) ✅

#### TD-031. Corrigir warnings do ESLint (34 warnings) ✅
- **Comando:** `pnpm lint --fix`

#### TD-032. Atualizar dependências com vulnerabilidades ✅
- **Comando:** `pnpm audit fix`

#### TD-033. Remover imports não utilizados ✅
- **Ferramenta:** ESLint autofix

#### TD-034. Corrigir typos em comentários/docs ✅
- **Ferramenta:** cSpell ou manual

#### TD-035. Adicionar `.editorconfig` para consistência ⏳
- **Conteúdo:** indent_style, charset, trim_trailing_whitespace

### 5.8 Refatorações Estruturais (>1 dia cada) ⏳

#### TD-036. Migrar de Pages Router para App Router (Next.js 15) 🔴
- **Contexto:** Projeto usa App Router, mas alguns padrões são de Pages
- **Esforço:** Alto
- **Decisão:** Validar se já está em App Router

#### TD-037. Implementar feature flags ⏳
- **Contexto:** Features experimentais sem toggle
- **Solução:** LaunchDarkly ou similar

#### TD-038. Separar monorepo (frontend/backend) 🔴
- **Contexto:** Tudo em um único package
- **Decisão:** Avaliar necessidade real

#### TD-039. Adicionar internacionalização (i18n) 🔴
- **Contexto:** App em português hardcoded
- **Prioridade:** Baixa até ter usuários internacionais

#### TD-040. Implementar design system standalone 🔴
- **Contexto:** Componentes não reutilizáveis fora do projeto
- **Solução:** Storybook + pacote NPM separado

### 5.9 Melhorias de DX (Developer Experience) ⏳

#### TD-041. Adicionar snippets VSCode para componentes ⏳
- **Contexto:** Boilerplate manual
- **Solução:** `.vscode/snippets.json`

#### TD-042. Configurar debug profiles para VSCode ⏳
- **Contexto:** Desenvolvedores usam `console.log` excessivamente
- **Solução:** `.vscode/launch.json` para Next.js

#### TD-043. Adicionar git hooks para validação de branches ⏳
- **Contexto:** Branches com nomes inconsistentes
- **Solução:** Padrão `feat/`, `fix/`, `chore/`

#### TD-044. Implementar gerador de componentes (plop.js) ⏳
- **Contexto:** Boilerplate manual para novos componentes
- **Comando:** `pnpm generate:component`

#### TD-045. Adicionar aliases de import mais curtos ⏳
- **Contexto:** Imports relativos profundos (`../../../`)
- **Solução:** `@components`, `@lib`, `@hooks` em `tsconfig.json`

### 5.10 Outros (Prioridade: Avaliar) 🔴

#### TD-046. Avaliar necessidade de GraphQL vs REST ⏳
- **Contexto:** Overfetching em algumas telas
- **Decisão:** Reavaliar com métricas reais

#### TD-047. Implementar retry logic em requests ⏳
- **Contexto:** Falhas de rede não recuperáveis
- **Solução:** Exponential backoff

#### TD-048. Adicionar telemetria de uso (analytics) 🔴
- **Contexto:** Sem dados de comportamento do usuário
- **Solução:** PostHog ou Mixpanel (compliance LGPD)

#### TD-049. Implementar versionamento de banco de dados ⏳
- **Contexto:** Migrações Prisma sem rollback strategy
- **Solução:** Documentar processo de rollback

#### TD-050. Criar roadmap público ⏳
- **Contexto:** Usuários sem visibilidade de próximas features
- **Solução:** GitHub Projects público

#### TD-051. (P1) POST /api/athlete-claims vulnerável sem auth ✅
- **Contexto:** Qualquer usuário podia reivindicar atletas em nome de terceiros.
- **Solução:** Resolvido na Fase 1 com `getAccessUserFromRequest`, `userId` estritamente da sessão e validações de integridade.

#### TD-052. (P2) GET /api/players sem userId expõe lista global ⏳
- **Contexto:** Endpoint expõe todos os atletas sem escopo e sem mascarar menores.
- **Solução:** Implementar `resolvePoolScope` e DTO mínimo na Fase 4.

#### TD-053. (P3) createPlayer não gera athleteCode ⏳
- **Contexto:** Atletas novos nascem sem código público @unique.
- **Solução:** Integrar geração com retry no `createPlayer` na Fase 5.

#### TD-054. (P4) generateAthleteCode usa Math.random ⏳
- **Contexto:** Geração não é CSPRNG e não trata colisões na persistência.
- **Solução:** Substituir por `crypto.randomInt` e loop de retry na Fase 2.

#### TD-055. (P5) /signup duplica atleta sempre ⏳
- **Contexto:** Cadastro de ATLETA cria sempre nova linha de Player.
- **Solução:** Claim automático na Fase 8 por CPF + data de nascimento.

#### TD-056. (P6) /signup grava e-mail na coluna User.cpf ⏳
- **Contexto:** Quando login é por e-mail, o e-mail era gravado em User.cpf.
- **Solução:** Separar campos no schema Zod, validar mod 11 de CPF e sanear legados.

#### TD-057. (P7) CreatePlayerInputSchema sem dados de pool/clube ⏳
- **Contexto:** Schema não previa cpf, myClub nem ctId.
- **Solução:** Schema renovado na Fase 5.

#### TD-058. (P8) listMatches filtra apenas por createdByUserId ⏳
- **Contexto:** Gestores e técnicos não veem partidas do seu clube/contexto.
- **Solução:** Escopo por vínculo ativo na Fase 6.

#### TD-059. (P9) Club e TrainingCenter desconectados ⏳
- **Contexto:** Club (venue textual) e TrainingCenter (entidade) paralelos.
- **Solução:** Adicionar Club.ctId @unique na Fase 3.

#### TD-060. (P10) Falta de índice de busca por nome em Player ⏳
- **Contexto:** Busca textual sem índice pode degradar com escala.
- **Solução:** Adicionar índice/trigram na Fase 3.

#### TD-061. (P11) buildActor não carrega CTs de atleta via PlayerCT ⏳
- **Contexto:** Atletas vinculados via PlayerCT têm activeCtIds vazio.
- **Solução:** Mapear athleteProfile.playerCts para athleteCtIds no Actor na Fase 2.

---

## 6. Melhorias e Otimizações

### M0. Limpar resíduos do antigo modal de saque ⏳
- **Contexto:** o painel inline substituiu o `ServerEffectModal`; `openAceModal` segue em `useScoringHandlers.modals.service.ts` / `scoring-handlers.return.types.ts` sem uso na UI, e `serverEffectWinnerName` (`useScoringPageDerived`) ficou sem consumidor
- **Solução:** remover com seus testes (`useScoringHandlers.modals.service.test.ts`) e apagar os `*.archive` do modal após validação em produção

### M1. Melhorar UX do cronômetro de partida ⏳
- **Contexto:** Feedback de usuários sobre dificuldade de pausar/retomar
- **Solução:** Botões maiores, confirmação antes de finalizar

### M2. Adicionar busca global (Cmd+K) ⏳
- **Contexto:** Navegação entre partidas/jogadores lenta
- **Solução:** Command palette estilo Spotlight

### M3. Implementar atalhos de teclado para anotação ⏳
- **Contexto:** Anotadores perdem tempo clicando
- **Solução:** Hotkeys para eventos comuns (1=ponto, 2=rebote, etc.)

### M4. Adicionar gráficos de tendência nas estatísticas ⏳
- **Contexto:** Apenas tabelas, sem visualização
- **Solução:** Recharts ou similar

### M5. Melhorar onboarding de novos usuários ⏳
- **Contexto:** Taxa de abandono alta no primeiro uso
- **Solução:** Tour guiado interativo

---

## 7. Itens de Backlog (Não Iniciados)

### N1. Sistema de notificações push 🔴
- **Escopo:** Notificar usuários de eventos importantes via browser/mobile

### N2. Exportação personalizada de relatórios 🔴
- **Escopo:** Usuário escolhe métricas e formato (PDF/Excel/CSV)

### N3. Integração com redes sociais (compartilhar resultados) 🔴
- **Escopo:** Botão "Compartilhar" gerando card visual

### N4. Sistema de convites/gestão de equipe 🔴
- **Escopo:** Admins convidam anotadores por email

### N5. Histórico de alterações (audit log) 🔴
- **Escopo:** Registro de quem editou o quê e quando

### N6. Modo de treino/simulação 🔴
- **Escopo:** Ambiente sandbox para testar anotação sem afetar dados reais

### N7. Suporte a múltiplos esportes 🔴
- **Escopo:** Generalizar para vôlei, futebol, etc.
- **Decisão:** Fora do escopo MVP

### N8. API pública para integrações 🔴
- **Escopo:** Endpoints REST documentados + autenticação via API key

### N9. White-label/customização visual 🔴
- **Escopo:** Clubes personalizarem cores/logo

### N10. Análise preditiva (Machine Learning) 🔴
- **Escopo:** Prever resultados baseado em histórico
- **Decisão:** Fora do roadmap atual

### N11. Mobile app nativo (React Native) 🔴
- **Escopo:** App iOS/Android
- **Decisão:** PWA suficiente por enquanto

---

## Legenda de Status

- 🔴 **Não Iniciada** - Aguardando priorização
- ⏳ **Em Andamento** - Trabalho ativo ou parcialmente completo
- ✅ **Concluída** - Implementada e validada

---

**Próximos passos sugeridos:**
1. Executar C2 (RLS) - risco crítico de segurança
2. Completar A1 (Estatísticas) - feature mais requisitada
3. Resolver TD-001 a TD-005 (segurança)
4. Aumentar cobertura de testes (C1, TD-011, TD-012)
