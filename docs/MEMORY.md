# MEMORY — RKT (Racket App)

> Diário de bordo técnico · Metodologia RE-DOC (Fase 4 — Auditoria de Qualidade e Histórico)
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.

**Última Atualização:** 2026-10-28
**Analisado por:** engenharia reversa e implementação sobre `main`

---

## 2.5 Alinhamento ao Design System Stitch (Court Precision Tech) e Segregação Treinador vs Atleta — 2026-10-28
- **Auditoria Stitch MCP:** Extraída a especificação canônica do Stitch (`Court Precision Tech`, asset `b1945ff952d84e4090726bd43b00300a`, projeto `1329349350691583873`).
- **Segregação de Personas:** Reforçado o desacoplamento de domínio entre Treinador e Atleta (ADR-0007, ADR-0008, ADR-0009). Em vez de redirecionar Treinador para `/atletas` genérico, as rotas sem interface desenvolvida foram marcadas com `disabled: true, badge: 'Em breve'` via helper puro `soon(...)` em `menu-items.ts`, eliminando erros 404 e preservando a integridade arquitetural.
- **Correções Executadas:**
  1. *Admin:* Corrigido bug de `opacity-20` nos containers de `admin-dashboard-chrome.tsx` e `admin-users-table.tsx` para `border-telemetry-border/20`; substituídos badges de cores arbitrárias em `admin-profile-options.ts` por tokens semânticos de telemetria; saneamento da mensagem de erro em `page.tsx` para `telemetry-error`.
  2. *Gestor:* Corrigida violação WCAG de contraste em `athletes-table.tsx` e `coaches-table.tsx` (`bg-telemetry-volt text-white` → `text-black font-bold`); migração de `tab-nav.tsx` e `managers-section.tsx` para tokens de telemetria; adequação completa de todos os modais (`cadastrar-membro-modal.tsx`, `cadastrar-membro-confirm-modal.tsx`, `cadastrar-membro-form.tsx`, `editar-atleta-modal.tsx`, `editar-treinador-modal.tsx`, `editar-clube-modal-gestor.tsx`, `link-copy-modal.tsx`) para Level 3 do Stitch (`bg-telemetry-card`, `border-telemetry-border/20`, `text-telemetry-text-primary`, `backdrop-blur-sm`).
- **Garantias de Engenharia:** 100% STE-DEV R-03 (0 violações em 992 arquivos), `typecheck` 0 erros, `test:design` 3/3 (26/26 testes verdes), 403 arquivos de teste sem skip/only.

---

## 2.4 Correção de Roteamento por Perfil, Autorização de Partidas e Inconsistências — 2026-10-27
- **Diagnóstico e Planejamento:** Salvo o plano [`docs/PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md`](file:///C:/apps/RKT/docs/PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md) e registrado em `docs/TASKS.md` (A0.6).
- **Escopo Mapeado:**
  1. Comparação incorreta de `Player.id` com `User.id` em endpoints de partida (`/matches/[id]`, `point`, `state`, `finish`);
  2. Autorização "falha aberta" caso o modelo de sessão esteja indisponível;
  3. Redirecionamento indevido no middleware e código inalcançável (`SUPORTE -> /suporte`);
  4. Falta de sidebar compartilhada em `/gestor`, `/suporte` e `/admin`;
  5. Links apontando para 404 em `club-matches-table.tsx` (`/match/${id}`);
  6. Migração de classes visuais arbitrárias para o design system (`telemetry-*`).
- **Estado:** Plano documentado e aprovado, pronto para execução em 4 etapas conforme priorização.

---

## 2.3 Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade — 2026-10-27
- **Início dos Trabalhos:** Plano aprovado em `docs/PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md` e registrado em `docs/TASKS.md` (A0.5).
- **Fase 0 (Characterization-First):** Criação de testes de caracterização para travar o comportamento prévio de `/api/auth/signup`, `/api/players` e `/api/athlete-claims`. ✅
- **Fase 1 (Segurança Imediata e Sanitização de Dados):** ✅
  - Correção de vulnerabilidade crítica P1 em `POST /api/athlete-claims` (exigência de autenticação e atribuição mandatória de `userId` a partir da sessão ativa).
  - Correção de bug P6 em `src/app/api/auth/signup/route.ts` (impedir gravação de e-mail na coluna `User.cpf`, validação estrita de dígitos de CPF).
  - `User.cpf` tornado opcional (`String? @unique`) via migration `20261027040000_make_user_cpf_optional`.
- **Fase 2 (Núcleo Puro e Actor):** ✅
  - `src/core/athlete/dedup.ts` — regras puras de desduplicação (`sameCpfHash`, `sameLast2AndDob`, `sameNameAndDob`, `isProbableDuplicate`, `findDuplicates`).
  - `src/core/access/pool.ts` — `resolvePoolScope` (CT vs ANY), `actorCtIds`, `maskNameForMinor`, `toPoolPlayerView`.
  - `src/core/athlete/athlete-code.ts` — `crypto.randomInt` (CSPRNG) substitui `Math.random`; `generateUniqueAthleteCode` com retry.
  - `src/core/access/types.ts` — `Actor.athleteCtIds`.
  - `src/services/access-actor.logic.ts` + `accessService.ts` — `buildActor` mapeia `athleteProfile.playerCts` → `athleteCtIds`.
  - Migration `20261027020000_pool_cpf_athletecode` — `Player.cpfHash`, `Player.cpfLast2`, `Club.ctId` + índice único + FK.
- **Fase 3 (Busca no Pool e Escopo):** ✅
  - `src/core/access/pool.ts` — `maskNameForMinor`, `toPoolPlayerView`, `PoolPlayerRow`/`PoolPlayerView`.
  - `src/services/player-service-pool.logic.ts` — `listPoolPlayers` com busca por nome + filtro por CT + paginação por cursor.
  - `src/app/api/players/pool/route.ts` — `GET /api/players/pool` com auth, escopo, mascaramento de menores, DTO mínimo.
  - Migration `20261027030000_pool_search_index` — índice em `Player.name`.
- **Fase 4 (Cadastro de Atleta):** ✅
  - `src/schemas/player.ts` — `CreatePlayerInputSchema` com `cpf`, `myClub`, `ctId`.
  - `src/services/player-create.logic.ts` — `createPlayer` com hash de CPF, geração de `athleteCode` seguro, `identityStatus` (PROVISIONAL/CONFIRMED), `PlayerCT` (ACTIVE/PENDING).
  - `src/app/api/players/route.ts` — `POST` com `getActor`, `resolvePoolScope`, `actorCtIds`, `actorCreatingProfile`.
- **Fase 5 (Claim Automático e Cadastro de Conta):** ✅
  - `src/app/api/auth/signup/signup-post.logic.ts` + `signup-claim.logic.ts` — claim automático por CPF+birthDate, validação de maioridade, `blocked-minor` para menores.
  - `src/app/api/auth/signup/me/route.ts` — `GET /api/athlete-claims/me` para o atleta consultar seus claims.
- **Fase 6 (Unificação de Clubes e Venues):** ✅
  - `src/app/api/clubs/route.ts` — `POST` aceita `ctId` (validação CUID via Zod).
- **Fase 7 (Frontend Nova Partida e Modais):** ✅
  - `src/app/match/new/useNewMatchState.ts` — estados `myClub`, `ctId`, `availableCts`; carrega CTs via `GET /api/auth/me`.
  - `src/app/match/new/components/my-club-toggle.tsx` — checkbox "Meu clube" + select de CT.
  - `src/app/match/new/components/PlayerSelection.tsx` — filtro de atletas por CT quando `myClub=true`.
  - `src/app/match/new/build-match-payload.logic.ts` — inclui `ctId` e `clubId`.
  - `src/app/match/new/components/NewAthleteModal.tsx` + `use-new-athlete-modal.ts` — envia `myClub`/`ctId` ao criar atleta.
  - `src/app/api/matches/match-ct-access.logic.ts` — `assertCtMembership` aceita ATLETA vinculado ao CT.
- **Fase 8 (Suporte e Resolução de Conflitos):** ✅
  - `src/services/player-merge.logic.ts` — `mergePlayers` com transferência de partidas, PlayerCTs, `mergedIntoId` e auditLog.
  - `src/app/api/players/merge/route.ts` — `POST /api/players/merge` com permissão `platform:player:merge`.
  - `src/app/api/athlete-claims/me/route.ts` — `GET /api/athlete-claims/me`.
- **Fase 9 (Testes Rigorosos):** ✅ — `typecheck` 0 erros · `check:r03` 0 regressões · `lint` 0 erros (apenas warnings jsx-a11y pré-existentes).
- **Fase 10 (Documentação):** ✅ — ADR-0010/ADR-0011 em `docs/ARCHITECTURE.md`; contratos em `src/app/api/CONTRACTS.md`; PRD, glossario, TASKS e MEMORY atualizados.

---

## 2.2 Enriquecimento de Perfis — 2026-10-27
- **Fase 1 (Gestor de Clube):**
  - Implementada redefinição de senhas com modal de cópia de link (`LinkCopyModal`) integrado na UI (`AthletesTable` e `CoachesTable`). Corrigido endpoint `regenerate-link` para persistir `tokenHash` em `password_reset_requests` e aceitar IDs cruzados (`playerCT.id` / `player.id` / `user.id`).
  - Edição de treinadores e atletas na UI conectada com pré-preenchimento real e chamadas `PATCH /api/gestor/athletes/[id]` e `PATCH /api/gestor/coaches/[id]`.
  - Visualização de partidas do clube via novo endpoint `GET /api/gestor/matches`, componente `ClubMatchesTable` e nova aba no `TabNav` e contadores no dashboard.
  - Tela `/trocar-senha` adaptada para fluxo com token direto.
- **Fase 2 (Suporte RKT):**
  - Gestão de clubes com ciclo de vida completo: Aprovação (`PENDING` -> `ACTIVE`), Bloqueio (`ACTIVE` -> `SUSPENDED`) com revogação imediata de sessões ativas dos gestores (`bumpSessionVersion`), e Desbloqueio/Reativação (`SUSPENDED` -> `ACTIVE`). Edição de dados do clube habilitada em `ClubesSection` e `EditarClubeModal`.
  - Gestão de gestores em `GestoresSection` com emissão direta de link seguro de redefinição de senha (`POST /api/support/password-resets`) e modal de cópia (`LinkCopyModal`), revogação de sessões ativas com confirmação (`POST /api/users/[id]/revoke-sessions`) e edição cadastral via `EditarGestorModal`.
  - Proteção de contas privilegiadas: Suporte não pode emitir reset para ADMIN ou outros usuários SUPORTE (`isProtectedTarget`).
  - Auditoria completa em todas as ações de suporte (`CLUBE_APROVADO`, `CLUBE_SUSPENSO`, `CLUBE_REATIVADO`, `PASSWORD_RESET_TOKEN_ISSUED`).
- **Fase 3 (Menus Dinâmicos por Perfil, Controle de Rotas e Contraste do Admin):**
  - Resolvido contraste e legibilidade no painel `/admin` (`admin-users-table.tsx` e `admin-dashboard-chrome.tsx`), eliminando herança de texto branco sobre fundo branco.
  - Sincronização de perfis aprimorada no backend (`admin-service-role-sync.logic.ts`) para `GESTOR`, `TREINADOR`, `SUPORTE`, `ATLETA_CLUBE` e `ATLETA_AVULSO` com desativação de memberships conflitantes.
  - Helper `getInitialRole` no frontend garantindo que a edição no admin pré-selecione o perfil real do usuário.
  - Menus laterais dinâmicos via `buildMenu(ctx)` e `mapMenuSectionsToSidebar`, mapeando rotas diretamente para abas ativas (`/gestor?tab=coaches`, etc.) e sub-módulos (`/suporte?module=gestores`, etc.).
  - Route guards por perfil no middleware para `/admin`, `/suporte` e `/gestor`.
  - 100% dos testes de menus e dashboard passando (`HamburgerMenu.test.tsx` 14/14, `DashboardAnnotatedView.test.tsx` 6/6, `training-centers` 3/3).
  - 0 violações de R-03 e 0 erros de TypeScript.

---

## 1. Estado Atual do Projeto

| Dimensão | Situação |
|---|---|
| Branch | `main` |
| Working tree | Alterações do backend da Fase 3 validadas; migration aplicada localmente e em produção |
| Foco atual | **Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade (A0.5) concluído:** Fases 0–10 implementadas e validadas (typecheck 0 erros, testes verdes, R-03 respeitado). Próximo foco: A1 (Estatísticas do Jogador) ou A0.7 (Edição de Clubes/Gestores/CTs). |
| Docs de processo | `AGENTS.md` (índice) + estritamente os 6 arquivos-canônicos em `docs/` |

---

## 2.1 Implementação em andamento — 2026-10-26

- Implementados schema/migration aditiva, rotas para torneios, vínculos treinador-atleta e pedidos de acesso do suporte; partidas novas aceitam `ctId` somente para membro ativo do CT.
- Relatórios passam por `report:view` e visibilidade por criador, anotador, equipe do CT, atleta/responsável ou treinador com vínculo ativo. Comentários, metadados de áudio, áudio e eventos privados ficam restritos a criador/anotador/equipe do CT.
- Validados: Prisma, TypeScript, lint focado, `check:r03` e testes focados (223 testes verdes).
- Migration `20261026020000_phase3_relationships_and_tournaments` aplicada localmente e em produção.
- Produção não tinha `_prisma_migrations`; o schema físico foi comparado com o Prisma antes da reconciliação. Foram registradas como aplicadas somente as migrations já refletidas fisicamente, incluindo `20261026013018_papers_25102026`; o SQL destrutivo dessa migration **não foi executado**. Aplicadas por `migrate deploy` as migrations pendentes de RLS, fundação de acesso e Fase 3, sem reset.
- Pós-aplicação: 18/18 migrations aplicadas, diff Prisma sem alterações pendentes e contagens preservadas (9 usuários, 41 atletas, 25 partidas e 600 pontos). As tabelas novas da Fase 3 estão vazias; o backfill criou a associação de plataforma do ADMIN e marcou 8 usuários como operacionais.
- **Alinhamento de RLS & Infraestrutura:** As políticas de RLS estão aplicadas no banco como camada de defesa em profundidade, mas a segurança primária e o isolamento multi-tenant residem no código (`withRLSHandler`, `withPermissionHandler` e filtros de ownership nos services). Para atender ao Free Tier (Vercel + Neon Pooler) sem risco de timeouts ou esgotamento de conexões, a aplicação conecta via role padrão (`neondb_owner`) e o middleware redundante de `set_config` foi removido de `src/lib/prisma.ts` (economizando 50% das queries). TD-003 encerrado.
- **Remediação de Acesso, Segurança e Consistência Funcional (Fases 0 a 5 Concluídas):** Salvo plano canônico em `docs/archive/PLANO_REMEDIACAO_ACESSO_E_SEGURANCA.md`.
  - **Fase 0 (Estancamento Crítico):** Liberação de `PUBLIC_ROUTES` no middleware (`signup`, `forgot`, `reset-password`), blindagem com `withAccessHandler` e auditoria em `password-resets`, `memberships`, `athlete-claims/decide`, sanitização de `users/[id]/export` (sem vazamento de `passwordHash`), e proteção com anonimização real e revogação de sessões em `users/[id]/anonymize`, `revoke-sessions` e `operate`.
  - **Fase 1 (Restauração da API de Atletas):** Restauração integral de `GET` e `POST` em `/api/players` e `GET`, `PUT`, `DELETE` em `/api/players/[id]` conectando os módulos `player-put.logic.ts` e `player-delete.logic.ts`. 100% dos testes de `/api/players` recuperados (55/55 testes verdes).
  - **Fase 2 (Unificação de Papéis e Contexto de Operação):** ADMIN legado conciliado em `accessService.ts` e `access-actor.logic.ts` com papel `PLATAFORMA/ADMIN`. Geração de token com `deriveLegacyRole` sincronizada com memberships. Fallbacks de Actor e resiliência em `accessService.ts` e `match-access-service.ts`. 100% dos testes de `/api/matches` verdes (36/36 suítes, 214 testes).
  - **Fase 3 (Blindagem das 31 Rotas Scaffold com withAccessHandler):** Lote A (`/api/training-centers`, `/api/clubs`, `/api/link-invites`, `/api/invites/accept`), Lote B (`/api/players/merge` com `auditLog`, `/api/players/provisional`), Lote C (`/api/guardians/link`, confirmação de vínculo em `/api/guardians/link/[id]/confirm`, revogação em `/api/guardians/link/[id]`, consentimento em `/api/consents` e `/api/consents/[id]`).
  - **Fase 4 (Integridade de Dados e Menores):** Migration `20261026030000_unique_coach_avulso` criando índice parcial de unicidade para treinadores avulsos (`WHERE ctId IS NULL AND status = 'ACTIVE' AND kind = 'TREINADOR'`). Proteção de dados sensíveis de menores em conformidade com ECA/LGPD.
  - **Fase 5 (UI/UX e Telas):** Tela de login atualizada com links de cadastro e recuperação de senha. Novas telas `/signup` e `/forgot` criadas com feedback interativo e modularizadas (<100 linhas). Hook client-side `useAccess` implementado e coberto com testes unitários em jsdom.
  - **Garantias de Engenharia:** `check:r03` com 0 violações e 0 regressões em 877 arquivos de produção. `tsc --noEmit` com 0 erros. Suíte de testes verdes.

- **Menus por Perfil e Pool de Ecossistema (Fase 0 concluída em 2026-10-26, somente documentação):** plano canônico em `docs/PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md`; ADR-0008 (pool global, clube como vínculo) e ADR-0009 (menu como soma de seções por vínculo) em `docs/ARCHITECTURE.md`. Decisões fechadas: atleta de clube só sai quando o gestor desvincula; treinador avulso anota partidas e vê relatórios dos atletas que acompanha; gestor vê e anota partidas do clube; Financeiro e Torneios aparecem desabilitados ("Em breve"); menu do Admin inalterado. Próxima etapa: Fase 1 (`/api/auth/me` aditivo + `buildMenu`).
- **Edição de Clubes, Gestores, Dados do CT e Gestão de Treinadores e Atletas (Planejada em 2026-10-27):** plano canônico salvo em `docs/PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md`. Estruturado em 4 frentes: (1) `/suporte` > Clubes e CTs com botão "Editar" funcional em ativos, modal de edição e projeção de dados cadastrais da PJ; (2) `/suporte` > Gestão de Gestores com botão de edição de usuário, correção do RBAC para permissão `platform:users:manage` pelo perfil `SUPORTE` e renderização condicional/reativa de `EditarGestorModal`; (3) `/gestor` > Dados do Clube com rota dedicada `GET` e `PATCH /api/gestor/club`, exibição dos dados reais da PJ do cadastro e trava estrita de CNPJ imutável; (4) `/gestor` > Treinadores e Atletas com modal unificado de cadastro (Nome, CPF, Data de Nascimento e seletor Treinador/Atleta), botões de edição de linha e suporte à seleção por linha nas tabelas.



---

## 2. Últimos Commits (linha do tempo recente)

| 2026-10-25 | `HEAD` | **Scoring (Chip Compacto de 2º Saque Inline sob o Card do Sacador)** — Migração do badge de 2º saque da barra inferior (ActionBar) para a coluna do sacador (ServeInlineControls), renderizando uma linha divisória com chip centralizado (`2º Saque`) entre o `PlayerCard` e os botões de ação de saque (`Ace`, `Out`, `Net`) exclusivamente durante o 2º serviço (`step === 'second'`). A barra inferior fica limpa contendo apenas os checkboxes de configuração (`Detalhes do ACE` e `Detalhes da DF`). Zero impacto em banco de dados ou schemas (ajuste puramente de apresentação UI). DoD: typecheck ✓ (0 erros) · 224/224 testes de scoring passando ✓ · STE-DEV R-03 (módulos ≤ 100 linhas). |
| 2026-10-25 | `HEAD` | **Scoring (Ace/Out/Net sob o card do sacador + detalhes inline, sem scroll interno)** — (i) `ServeActionButtons`, `ServeInlinePanel` e `ServeInlineControls` renderizam Ace/Out/Net logo abaixo do `PlayerCard` do sacador (coluna acompanha `p1IsServing`/`p2IsServing`); (ii) o `ServerEffectModal` (overlay) foi substituído por painel inline que expande no lugar, com as mesmas opções de efeito/direção: Ace segue "Detalhes do ACE"; Out/Net seguem "Detalhes da DF" no 1º e no 2º saque; sem o checkbox, registra direto; (iii) estado em `use-serve-inline-controls.ts` (checkboxes + painel aberto), com fechamento automático quando o ponto muda, outro modal abre ou o sacador troca; Cancelar só fecha o painel (não chama `cancelServeError`, preserva o 1º saque); (iv) handlers `recordServeErrorWithModal`→`startServeErrorDetails` e novo `dismissServeErrorDetails`; (v) `ActionBar` ficou só com selo de saque + checkboxes; (vi) `ScoringPlayArea` sem `overflow-y-auto`: alturas via `clamp(..dvh)` e, com painel aberto, blocos secundários recolhem em telas baixas (`globals.css`, `data-serve-collapse`); (vii) arquivos do modal arquivados com sufixo `.archive`. Mínimo de altura dos botões: 40px em telas muito baixas. DoD: validar localmente `typecheck`, `test:design` e os testes de scoring (ver comando na entrega). |
| 2026-10-25 | `HEAD` | **Scoring & Live Counters (Registro de Break Point e Game Point em 40/40 no modo No-Ad)** — Correção do reconhecimento e cômputo estatístico no ponto decisivo (40/40) em formatos No-Ad (`BEST_OF_3_NO_AD` e `SHORT_SET_2V2_NO_AD`): (i) `point-ball-context.logic.ts`: extensão de `isPointDecisiveDeuce` para detecção de qualquer formato No-Ad e atualização de `isGameBall` aceitando `format` e retornando `true` em ponto decisivo; (ii) `point-snapshot.logic.ts` e `scoring-logic.ts`: propagação de `format` em `derivePointSnapshot` e `enrichPointsFromHistory`, garantindo que os pontos gravados na timeline carreguem `isBreakPoint: true` (para o devolvedor) e `isGameBall: true` (para ambos); (iii) `live-counters.logic.ts` e `use-scoring-page-chrome.ts`: passagem do formato da partida para `computeLiveCounters` e `computeAdvancedStats`, refletindo instantaneamente as oportunidades e conversões de break point na célula de resumo do grid de 'Estatísticas ao Vivo' e no modal 'Resumo do Set'; (iv) `return-stats.ts`, `serve-stats.ts`, `set-summary-service.logic.ts` e `timeline-rebuild.ts`: suporte resiliente com fallback bilateral (`isBpForPlayer` / `isBpAgainstServer` e `isPointDecisiveDeuce`) para garantir retrocompatibilidade com pontos gravados e reconstrução da timeline. 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 357/357 suites, 3.482 testes passando, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Scoring (Otimização de Duração do Rallye nos Detalhes do Ponto)** — Remoção da opção redundante `1-4 bolas` das pills de seleção no modal `PointDetailsModal` (`DURACAO_OPTIONS`), disponibilizando apenas `5-8 bolas` e `+9 bolas`. Qualquer ponto sem indicação de rali longo assume o padrão canônico de rali curto (`1-4 bolas`). Habilitação de toggle na seleção de duração (`Action SET_DURACAO` aceitando `RallyDuration | null`), permitindo desmarcar uma opção tocando nela novamente. Preservação total de retrocompatibilidade de `opcao_1` em schemas e relatórios históricos. 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 356/356 suites, 3.474 testes passando, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Scoring (Aproach FH / BH e Efeito Dinâmico nos Detalhes do Ponto)** — Extensão dos detalhes do ponto para registro fidedigno de aproachs: (i) Inclusão de `approach_fh` ("Aproach FH") e `approach_bh` ("Aproach BH") no enum canônico Zod `RallyGolpeSchema` e `GOLPE_LABELS`; (ii) Disponibilização condicionada na cascata do `PointDetailsModal` exclusivamente para: `passada > erro_forcado` e `rede > winner`; (iii) Lógica dinâmica de efeito em `shouldShowEfeito`: enquanto voleios diretos permanecem sem efeito, a seleção de um aproach em `rede > winner` exibe a seção de efeito com as opções `topspin`, `slice` e `flat`; (iv) Classificação estatística em `stroke-matrix-classify.logic.ts` mapeando aproachs para a linha correspondente da tabela matricial de 12 golpes e atribuindo forehand/backhand para estatísticas de pressão e rede em duplas; (v) Labels compactos na timeline (`Ap FH`, `Ap BH`) e validação transparente sem migrations no banco de dados (já armazenado como JSON de anotações). 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 356/356 suites, 3.473 testes passando, 0 skips, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Estatísticas Avançadas (Fases 1 a 5 — `docs/archive/Plano – Estatísticas Avançadas.md`)** — Execução integral das 5 fases de reformulação técnica e alinhamento à planilha ITF/ATP de 24/out/26: (i) Fase 1: 15 correções estruturais (ralis 1-4/5-8/+9, Ace/DF fora de winners/ENF de rali, Game Points e Set Points por jogador e dinâmicos por formato, Ponto Decisivo No-Ad duplo e break point para devolvedor, subidas e passadas bilaterais, breakdown por set com tiebreak formatado e p2Games corrigido, momentum sem corte artificial, resumo por games fechados, piso Grama, proteção de game incompleto, alinhamento CSV e unificação de resumo do set); (ii) Fase 2: 9 seções canônicas da planilha implementadas na íntegra com cálculos puros em `src/core/report/` e apresentação em `src/components/report/` (Saque, Devolução sem DF e com % retorno em quadra, Fundo de Quadra por ralis, Rally, Rede e Passada, Pontos de Pressão, Definição do Ponto sem Ace/DF, Tabela Matricial de 12 Golpes, Momentum); (iii) Fase 3: Cálculo canônico de tempo total e tempo efetivo (`MAX_GAP_SECONDS = 90`, descartando pausas >90s e transições entre sets); (iv) Fase 4: Cabeçalho superior completo da aba Avançadas (`AdvancedStatsHeader`) com metadados do evento, piso, clima e tempos; (v) Fase 5: Desdobramento individual de estatísticas por atleta em duplas (`computeDoublesPlayerStats` e `DoublesPlayerBreakdownSection` por `serverId`, `hitterId` e `courtSide`). Cumprimento estrito de STE-DEV R-03 (módulos ≤ 100 linhas). DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `lint` 0. |
| 2026-10-22 | `HEAD` | **Scoring (Correção de Set Fantasma 0-0 no Placar Dinâmico)** — Correção em `src/core/scoring/game-processing.ts` (`onGameWon`): remoção da checagem legada `currentSet.player1 === 0 && currentSet.player2 === 0`, que empilhava indevidamente um novo set via `.push()` quando o set inicial já existia no array `state.sets` (como no caso pós-edição de placar ou inicialização antecipada), fazendo o 1º set ficar congelado em 0-0 e o jogo em andamento ser exibido no Set 2. A condição foi unificada para usar estritamente `isNewSet` provido por `resolveActiveSet`. Adição de teste unitário de regressão e saneamento da partida no banco de dados local (`cmvj3l0bu0002bfe4c7mbud9w`). DoD: `typecheck` ✓ (0 erros) · 46/46 suites core/scoring (614/614) ✓. |
| 2026-10-22 | `HEAD` | **Suporte Completo a Duplas (Fases A a H — `docs/archive/PLANO_DUPLAS_2026-10-21.md`)** — Implementação end-to-end com 100% de retrocompatibilidade com simples: (i) Fase A: gravação defensiva e validação atômica; (ii) Fase B: núcleo puro de regras ITF de duplas em `src/core/scoring/doubles.ts` (ordem de saque A1→B1→A2→B2, tiebreak A1(1)→B1(2)→A2(2)→B2(2), lados fixos de devolução no set, deuce no-ad com escolha do devolvedor pela dupla receptora, ajuste de formação entre sets); (iii) Fase C: persistência Prisma com `matchType`, `player1PartnerId`, `player2PartnerId`, `doublesSetup`, migrations e rotas `/point`, `/arrangement`, `/state`, `/report`; (iv) Fase D: tela de nova partida com seleção de 4 atletas distintos e modal de formação inicial; (v) Fase E: UI de `/scoring` com indicador luminoso de sacador ativo, badge de devolvador ativo, `PointDetailsModal` com seleção de quem bateu e escolha de lado de devolução no deuce no-ad, e `DoublesArrangementModal` entre sets; (vi) Fase F: modal Editar Placar preservando rotação e estado de duplas; (vii) Fase G: timeline e relatório exibindo nomes e estatísticas de duplas, iniciais de sacador e time (`RF/ND`), e cards do dashboard; (viii) Fase H: 100% dos testes estritos passando (0 skips, 0 only, 613/613 core tests, 40/40 doubles tests, 234/234 UI tests, `tsc --noEmit` 0 erros). |
| 2026-10-20 | `HEAD` | **Report (Header fixo com rolagem inferior)** — Fixação do cabeçalho da tela de relatório (`ReportHeader` em `report-view-header.tsx`) com `sticky top-0 z-30 bg-telemetry-card/95 backdrop-blur-md border-b border-white/10 shadow-md`, permitindo que as abas (`TabBar`), estatísticas e a tabela de pontos da `Timeline` rolem suavemente por baixo do cabeçalho de identificação e metadados da partida. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `ReportPage.view.test.tsx` 3/3 ✓. |
| 2026-10-20 | `HEAD` | **Scoring (Detalhes do Ponto: Duração 1-4/5-8/+9 e despoluição visual)** — (i) Atualização dos intervalos de duração do rali no modal `PointDetailsModal` (`DURACAO_OPTIONS` em `point-details-logic.ts`) de `3 a 6`, `7 a 10`, `Mais de 11` para `1-4 bolas`, `5-8 bolas` e `+9 bolas`, unificando a entrada de dados com os padrões da ATP/ITF e o cálculo estatístico de ralis (`pressure-shot-stats.ts: short <= 4, medium 5-8, long >= 9`); atualização de `duracaoLabel`, `trocasFaixaLabel` em `timeline-format.ts` e legenda em `timeline-legend.tsx`; (ii) remoção do componente `PointDetailsBreadcrumb` e scroll handler em `PointDetailsModal.tsx`, eliminando duplicação visual e barra de rolagem horizontal desnecessária abaixo do `WinnerInfo`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `point-details-logic.test.ts` 43/43 ✓ · `timeline-utils.trocas-faixa.test.ts` 4/4 ✓ · `SectionRenderer.test.tsx` 28/28 ✓ · `PointDetailsModal.characterization.test.tsx` 60/60 ✓ · `PointDetailsModal.test.tsx` 4/4 ✓. |
| 2026-10-20 | `0961f7b` | **Scoring (Indicador de Saque em Match Tie Break)** — Correção do indicador de sacador (`p1IsServing` / `p2IsServing` e `effectiveScoreState.server`) no hook `useScoringPageDerived`: remoção da sobrescrita cega quando `totalGames === 0`, restringindo a imposição do `initialServerId` estritamente a estados virgens (`isVirginState`: sem games completados, sem pontos no game atual e sem pontos no tiebreak). Garante que a alternância ponto a ponto calculada pelo `ScoringEngine` em `MATCH_TB_10` seja refletida visualmente em tempo real nos cards de jogador e no placar. DoD: `typecheck` ✓ (0 erros) · teste de regressão `useScoringPageDerived.server-tiebreak.regression.test.ts` 3/3 ✓ · suites derivadas 6/6 ✓ · engine serverId 6/6 ✓. |
| 2026-10-18 | `HEAD` | **Alinhamento Stitch (Court Precision Tech)** — Implementação das melhorias ergonômicas e gaps identificados via StitchMCP: (i) tokens e utilitários de elevação luminosa `shadow-telemetry-volt` e `shadow-telemetry-blue` no Tailwind e CSS variables para Dark/Light; (ii) padronização de touch targets na `ActionBar` para `min-h-[48px]` com espaçamento estrito de 8px; (iii) isolamento físico do botão `↩ Voltar` no flanco esquerdo com controles secundários agrupados à direita; (iv) novo componente de navegação ágil `PointDetailsBreadcrumb` no topo do modal de detalhes com salto direto por seção; (v) saneamento de resíduos de classes genéricas `gray-*`/`blue-*` em `pills-component.tsx` e `SectionRenderer.tsx`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `PointDetailsBreadcrumb.test.tsx` 3/3 ✓ · `ActionBar.characterization.test.tsx` 11/11 ✓ · `PointDetailsModal.test.tsx` 64/64 ✓. |
| 2026-10-17 | `767bbad` | **Consistência Editar Placar, ACE/DF, Timestamp e Reidratação (Fases 0 a 5)** — (i) Fase 1: correção de `ScoringEngine.fromSerialized` para não forçar `initialServerId` indevidamente em `MATCH_TB_10` ou placares com pontos/jogos iniciados; modo sombra defensivo em `POST /point` (`logger.warn`) para divergência de sacador; script de auditoria `scripts/audit-server-id.ts` (37 partidas recuperadas/auditadas); (ii) Fase 2: reidratação pós-F5 do engine via replay de `PointLog` desde a última `MatchScoreEdit` (D4), habilitando botão "Voltar" (Undo) até a fronteira da edição; persistência de `pointLogSequenceAtEdit` em `MatchScoreEdit.newScoreState`; manutenção da sessão de anotação ativa após edição de placar em andamento (D6); (iii) Fase 3: contadores estatísticos separados: ACE não conta como winner de rally (D1), DOUBLE_FAULT não conta como UFE de golpe de rally e entra como erro do sacador nos erros totais do set (D2); (iv) Fase 4: validação e persistência do timestamp do cliente com proteção contra clock drift futuro e clamp seguro no início da partida (D3); (v) Fase 5: remoção de `isLet` de schemas, contratos e engine. DoD: typecheck ✓ (0 erros) · 8/8 suites engine (196/196) ✓ · suítes de teste de cada fase passando ✓. |
| 2026-10-16 | `HEAD` | **R-13 (Acessibilidade A11y)** — inclusão de `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `role="alert"` em mensagens de erro e semântica de tabs (`role="tablist"`, `role="tab"`, `aria-selected`) em todos os modais extraídos e formulários (`PointDetailsCloseDialog`, `PointDetailsModal`, `PointDetailsNotesModal`, `ServerEffectModal`, `comment-modal-body`, `server-effect-modal-close-dialog`, `NewAthleteModal`, `EditAthleteModal`, `schedule-confirm-modal`, `ConfirmDeleteMatchDialog`, `login/page.tsx`, `point-details-notes-fields.tsx`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · test:strict 296/296 (3200/3200) ✓ · lint 0. |
| 2026-10-16 | `623ae2f` | **R-12 (Tokens e Cores Semânticas)** — tokens de telemetria para superfícies de quadra (`clay`, `grass`, `hard`) em `globals.css` e `tailwind.config.ts`, e eliminação de 28 hexadecimais soltos e 14 rgba soltos em componentes de produção (`PointDetailsCloseDialog`, `CommentModal`, `comment-modal-body`, `comment-modal-views`, `PointDetailsModal`, `ServerEffectModal`, `ModalActions`, `WinnerInfo`, `CourtBackground`, `AnnotationSessionPanel`, `game-errors-histogram-slot`, `GameErrorsHistogram`, `match-card-score-table`, `match-card-player-row`, `use-match-card-data`, `matchConstants`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · lint 0 · testes de dashboard e scoring 10/10 (130/130) ✓. |
| 2026-10-16 | `1210a07` | **R-02/R-23 (P3)** — eliminação de resíduos Handler/Helpers em hooks e services de scoring: `useScoringCommentHandler.ts` → `useScoringComment.ts` (função `useScoringComment`), `useScoringEditScoreHandlers.ts` → `useScoringEditScore.ts` (função `useScoringEditScore`), `createServerResolutionService` e `createScoringModalsService` canônicos com aliases mantidos; DoD: typecheck ✓ · test:strict 296/296 ✓ · test:design 3/3 ✓ · lint 0. |
| 2026-10-16 | `d92f763` | **R-23 (P1)** — cluster save/create/submit e duplicações: desambiguação de `getGameProgress` (`getGamePointCount` em `matchValidator` vs `getGameProgressRatio` em `player-card.logic`), padronização de `submitFormPayload` (`submitLoginForm`, `submitMatchInfoForm`, `submitNewAthleteForm`, `submitNewMatchForm`), padronização de `persistFormChanges` (`saveAthleteChanges`, `saveEditedAthlete`, `saveComment`, `savePointNotes`), correção de `confirmMatchDeletion` → `confirmAthleteDeletion`, e contextualização de `confirmCurrentAction` (`confirmServerEffect`, `confirmPointDetails`, `confirmScheduleModal`); DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0. |
| 2026-10-16 | *WIP* | **Scoring / Timeline (Áudio)** — Correção vertical do áudio nas observações da Timeline: (i) desacoplamento de pareamento por índice em `enrichTimelineWithAudio` via busca imutável por `pointId` e contagem de pontos reais ignorando `segmentBreak`; (ii) unificação da ordenação em `point-logs-meta` (`sequenceNumber`, `timestamp`, `id`) alinhada com a rota `report`; (iii) seleção de `audioNoteMime` e inferência resiliente de `hasAudioNote` para gravações com duração curta; (iv) revalidação imediata em tempo real pós-upload (`onAudioUploaded`) invocando `fetchTimelinePoints()` e `setEngineTick()`; (v) validação estrita de `res.ok` em `uploadAudioNote`. DoD: typecheck ✓ · test:strict 298/298 (3205/3205) ✓ · test:design 3/3 (26/26) ✓ · lint 0 ✓. |
| 2026-10-16 | `cc63c4b` | **Login (cosmético)** — unificar redirects de logout/401 com `redirectToLogin()`. |
| 2026-10-16 | `04e069e` | **R-02 (A/B/C)** — nomenclatura proibida: 39 arquivos `*helpers*`/`*utils*` → `*logic*`/`*domain*` (`8c2f809`), 11 funções `process*` → `apply*` (`c4deacf`), 98 funções `handle*` → verbos canônicos (`b8d1b4e`) — 3 commits + remoção de mapa temporário; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; **produção: 0 violações R-02**. |
| 2026-10-16 | `af705d5` | **UI-32..UI-44** (rodada R-03 final): `SectionRenderer.tsx` 156→69, `NewAthleteModal.tsx` 155→83 (hook), `DateTimeSection.tsx` 154→60 (hook+input+modal), `ConfirmAlertDialog.tsx` 134→90 (logic+content), `SportFormatSection.tsx` 128→33 (3 subcampos), `login/page.tsx` 124→39 (hook+fields), `AudioNotePlayer.tsx` 123→39 (hook+logic), `match/new/page.tsx` 121→40 (form sections), `LiveCountersBar.tsx` 121→74 (guardião telemetry), `timeline-filters.tsx` 110→74 (Chip), `ThemeContext.tsx` 103→36 (hook), `match-card-components.tsx` 102→3 (barrel), `TournamentSection.tsx` 101→82 (autocomplete) — 13 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **13 → 0** (R-03 ✓). |
| 2026-10-16 | `90db474` | **UI-27..UI-31** (rodada R-03): `PointDetailsModal.tsx` 176→86 (hooks), `RankingForm.tsx` 175→32 (card+fields), `ScoringPlayArea.tsx` 169→98 (guardião telemetry), `PlayerCard.tsx` 159→56 (types/logic/touch), `AthleteListTable.tsx` 157→44 (row/empty/helpers) — 5 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **18 → 13**. |
| 2026-10-16 | `8329e9e` | **UI-21..UI-26** (rodada R-03): `ScoringModals.tsx` 203→91, `PointDetailsNotesModal.tsx` 201→84, `atletas/page.tsx` 197→82 (hook `useAtletasPage`), `ReportPage.view.tsx` 186→39, `GameErrorsHistogram.tsx` 184→68, `MatchDetailsSection.tsx` 178→90 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **24 → 18**. |
| 2026-10-15 | `0f7ec5a` | **UI-16..UI-20** (rodada R-03): `NewAthleteModalForm.tsx` 235→60, `ServerEffectModal.tsx` 235→95, `edit-score-summary.tsx` 216→92 (barrel), `EditAthleteModal.tsx` 215→97 (hook + submissão pura), `locate/page.tsx` 206→72 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **29 → 24**. |
| 2026-10-15 | `edfd783` | **UI-12..UI-15** (rodada R-03): `ScoreboardCard.tsx` 250→72, `admin/page.tsx` 249→77, `DashboardViewRouter.tsx` 241→98, `SessionContext.tsx` 238→98 — tipos (`*-types.ts`), lógica pura (`*-logic.ts`/`*.reducer.ts`), hooks (`use-*.ts`) e seções (kebab-case) em módulos ≤100L; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **33 → 29**. |
| 2026-10-15 | `a9ed92f` | **UI-10/UI-11**: `CommentModal.tsx` 293→47 (view/gravador/hook + body) e `EditScoreModal.tsx` 261→65 (tipos, shell, conteúdo com `EditScoreSetInputSection`, hook `use-edit-score-modal-view`) — 8 commits, ambos R-03 ✓. |
| 2026-10-25 | *WIP* | Dashboard & Match State: Correção do início de partidas agendadas (`SCHEDULED` -> `IN_PROGRESS`) após o horário previsto ou a partir do card no Dashboard. `MatchStateInputSchema` agora aceita `doublesSetup: DoublesSetupSchema.nullable().optional()` (eliminando `VALIDATION_ERROR` quando o Prisma retorna `doublesSetup: null` para partidas de simples ou agendadas) e `useDashboardServerStart` passa `doublesSetup` condicionalmente apenas se definido. |
| 2026-10-15 | `7ad8963` | **UI-9** `edit-score-form.tsx` 320 → 60 linhas: casca fina (`SetInputFormProps` + ref de foco) sobre `edit-score-form-body`/`-trail`/`-header`/`-feedback`/`-actions`/`-games-grid`/`-game-column` em 8 arquivos ≤100L. |
| 2026-10-15 | `3f257a2` | **UI-8** `AdvancedStats.tsx` 316 → 23 linhas: primitivas (`StatRow`, `Section`, `PlayerColumnHeader` deduplicando cabeçalho repetido em 4 seções), seções básicas (serve/return/pressure), `ShotSection` (com `ByStrokeGrid` deduplicando blocos idênticos), `MomentumSection` e `SetBreakdownSection` em 6 arquivos ≤100L. |
| 2026-10-15 | `c102365` | **UI-7** `SetSummaryModal.tsx` 327 → 91 linhas: `StatBarBilateral`, seções de estatísticas, cabeçalho/abas, card de placar, rodapé de ações e hook `useSetSummaryReport` (7 arquivos ≤100L). |
| 2026-10-15 | `93a6cda` | **UI-6** `dashboard/page.tsx` 337 → 69 linhas: `useDashboardPageModel` (auth/dados/modais/filtros + `resolveDashboardView`), `useDashboardMatchActions`, `useDashboardSetSummary`, `useDashboardServerStart`, `DashboardChrome` (topo/menu/logout), `DashboardMatchModals` + `ConfirmDeleteMatchDialog` (8 arquivos ≤100L). |
| 2026-10-15 | `a66caf2` | **UI-5** `scoring/page.tsx` 339 → 94 linhas: `scoring-page-screens`, `useScoringPageChrome` (tipos `ScoringPageState/Effects/Derived`), `scoring-page-play-area`, `scoring-page-controls` e `scoring-page-layout` (6 arquivos ≤100L). |
| 2026-10-14/15 | `a30b850` `172ac42` `12dfae9` `9f5b9fe` | **UI-1..UI-4 + R-01**: `MatchTimelineView.tsx` 535→96, `MatchCard.tsx` 409→86, `EditMatchInfoModal.tsx` 370→97, `timeline-rows.tsx` 342→81; `docs/glossario.md` recriado em UTF-8 limpo (147 linhas). |
| 2026-10-14 | `d05bc60` | **Fase 4** remoção de scratch files órfãos da raiz. |
| 2026-10-13 | *WIP* | Atletas (`RankingForm`, `NewAthleteModal`, `EditAthleteModal`): refatoração da disposição visual dos campos em 'Novo Atleta' e 'Editar Atleta', com layout fixo (flex-nowrap, shrink-0) onde o checkbox do ranking fica no topo à esquerda com o botão 'Remover' logo abaixo, e as colunas de Categoria, Classe, Posição e 'Posição Ranking Juvenil' têm seus rótulos alinhados horizontalmente com o checkbox na linha 1 e seus selects/inputs alinhados com o botão 'Remover' na linha 2, garantindo que todos os campos fiquem na mesma linha horizontal sem quebras. |
| 2026-10-13 | *WIP* | Dashboard MatchCard UI: remoção do prefixo 'Modo de jogo: ' no componente `FormatLabel`, mantendo o alinhamento estrito à direita (`ml-auto shrink-0 justify-end`) para que todas as ações e informações do cabeçalho caibam em uma única linha. |
| 2026-10-13 | *WIP* | Scoring (/scoring): (i) início do cronômetro interno da partida (`startedAt`) estritamente ao marcar o 1º ponto em nova partida via `ScoringEngine.applyPoint`, rota `POST /point` e `useScoringLifecycleEffects` com `setInterval`; (ii) no placar dinâmico (`ScoreboardCard`), títulos de colunas adaptados a cada formato do sistema (`Set 1`, `Set 2`, `TB` para formatos com super tiebreak; `TB` único para `MATCH_TB_10`; `Set 1..5` para `BEST_OF_5`), com ênfase visual na coluna do set em andamento; (iii) no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`), projeção visual de `2 a 2` em ambos os sets desde a criação. |
| 2026-10-13 | *WIP* | Dashboard MatchCard & Modal Editar Info: (i) projeção de 2-2 em ambos os sets no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`) desde a criação da partida no card; (ii) novo botão `⚙️ Info` no cabeçalho do `MatchCard` para partidas não finalizadas (`state !== 'FINISHED'`), abrindo o modal `EditMatchInfoModal`; (iii) inclusão e persistência do campo "Clube" (`clubName`) no Prisma, migration DDL, services, repository, modal de edição e relatório; (iv) correção do erro 405 (Method Not Allowed) em `/api/matches/[id]` ao exportar o método `PATCH = PUT`. |
| 2026-10-13 | *WIP* | Formulário 'Nova Partida' & Timeline Report: (i) campo horário opcional com correção definitiva de contraste/opacidade nos seletores de data e hora (modo claro e escuro, sem background branco indesejado e com ícones nativos invertidos/contrastados e showPicker no clique); (ii) criação direta ao dashboard sem modal de sacador; (iii) novo campo livre `details` persistido em `Match.details` (Prisma/DDL); (iv) exibição em 3 linhas estruturadas (linha 1: título, linha 2: rótulo/ex: Torneio, linha 3: valor/ex: Open) acima de 'Comentários' em `/report > timeline`. |
| 2026-10-13 | *WIP* | Correção do cálculo de "Resultado" ao final da timeline em `/report`: cálculo correto dos games no último ponto do set e propagação de `scoreState`. |
| 2026-10-08 | *WIP* | Desacoplamento de `history` de `Match.scoreState` no caminho quente do `POST /point` (eliminação do custo quadrático O(N^2)). Blindagem atômica do Undo (`voidLastPoint`/`isUndo`) sincronizando `PointLog`, backfill de tiebreaks legados, engine de Shadow Mode e reidratação de badges via `recentWinnerIds`. |
| 2026-10-08 | *WIP* | Correção do TD-003 (perda de contexto RLS com getRLSUser) via injeção de dependência no withRLSHandler. Adição de renovação deslizante de sessão e correção do middleware (token nulo). |
| 2026-10-05 | *WIP* | Correção do modal Editar Placar: regra de piso de abandono, alternância ITF de tiebreak, Deuce/Adv, auditoria de notas e blindagem Prisma |
| 2026-10-01 | `c53ae98` | Guardrails do Telemetry, toggle binário light/dark, saneamento de código morto legado |
| 2026-09-30 | `30ec07d` | Dual-theme, ações no header de card do dashboard, opacidade de fonte |
| 2026-09-30 | `77890d0` | Conflito de offline sync e fronteiras de papel (role boundary) |
| 2026-09-30 | `08257ec` | Timeline de scoring, editar placar e insights táticos |
| 2026-09-28 | `62ea451` | `PointDetailsModal`, `SectionRenderer`, `usePointDetailsScroll` |
| 2026-09-28 | `7b73a7c` | Ignorar artefatos de scratch/test-results |
| 2026-09-28 | `b30e906` | Redesign de UI em atletas, dashboard, criação de partida e scoring |
| 2026-09-28 | `e2e16b7` | Redesign de componentes + fluxos de ranking/atletas |
| 2026-09-26 | `fb4fb5f` | Bugs críticos de histórico e timeline |
| 2026-09-26 | `b1e2106` | Timezone de data e lógica de UI de ranking |

**Padrão observado:** ciclos curtos de `feat` → `fix` → `refactor` → `test(characterization)` no mesmo domínio (scoring/dashboard), com saneamento de legado no fim de cada ciclo.

---

## 3. Marcos do Projeto (histórico consolidado)

| Período | Marcos |
|---|---|
| 2026-06 | Migração inicial do domínio (users/players/matches/point logs) |
| 2026-07 | Adoção multi-agente (ADR-0001), Onda 0 Discovery, refatoração de hooks/pages, elevação de segurança (ADR-0005) |
| 2026-08 | Remoção da PWA, strategy de formatos (ADR-0003), repository pattern (ADR-0004), migrações de áudio e edição de placar |
| 2026-09 | Onda pesada de scoring: undo, idempotência, sessões, timeline, comentários/áudio, offline sync, relatório, RBAC resolvido (TD-051..055), limpeza de código morto |
| 2026-09 fim | Redesign de UI + dual theme |
| 2026-10-01 | Guardrails do Telemetry Design System |

---

## 4. Saúde Técnica
 
| Verificação | Estado |
|---|---|
| `pnpm typecheck` | ✅ **Executado em 2026-10-15 — sem erros** |
| `pnpm lint` | ✅ **Executado em 2026-10-15 — 0 erros / 0 warnings** |
| `pnpm test:design` | ✅ **Executado em 2026-10-15 — 3 suites / 26 testes passando** |
| `pnpm test:strict` | ✅ **Executado em 2026-10-15 — 291/294 suites e 3191/3196 testes passando**; 3 falhas = baseline pré-existente (`dashboard.hooks.guards`, `match-authorization.baseline`, `useOfflineSync.real`) |
| `pnpm test` / coverage | ✅ **Executado em 2026-10-05 — 277 suites / 3056 testes passando (100%)** |
| CI (`quality.yml`) | ✅ Configurado: typecheck → no-skipped-tests → test:strict → coverage (Postgres 16) |
| Mutation testing | ⚠️ Configurado (≥80% high) mas **fora do CI** (TD-015) |
| E2E | 6 specs (ciclo completo, sessão, offline ×2, undo, conflito) + a11y |

---

## 5. Dívidas e Riscos Vigentes (top 8)

| ID | Tema | Severidade | Situação |
|---|---|---|---|
| TD-003 | Propagação de RLS (`setRLSUser`) | Resolvida | Corrigido via injeção direta de `user` nos handlers, evitando falha de `AsyncLocalStorage`. |
| TD-008/060 | Segredos/centralização JWT (`src/lib/jwt.ts` nunca entregue) | Crítica | Texto revisado 2026-09-30: sem literal hardcoded |
| TD-001 | Sem testes de integração com banco real | Alta | Mitigação parcial via CI |
| TD-002 | Validação Zod incompleta nas APIs | Alta | ~8 endpoints pendentes |
| TD-009 | Sem rate limiting | Alta | Aberto |
| TD-015 | Mutation testing fora do CI | Média | Config pronto |
| TD-057 | `NEXT_PUBLIC_COMMENT_FEATURE` indefinida (CommentModal dormente) | Média | Decisão pendente |
| TD-011 | Componentes >300 linhas | Média | Parcialmente tratado (remoção de dead code 2026-09-22) |

Leitura completa: `docs/TASKS.md` — **Anexo A** (dívida técnica, 50 entradas / 48 únicos) e **Anexo B** (fila de refatoração, P1 #8–#10 abertos).

---

## 6. Avisos para o Próximo Agente

1. **Única fonte de diretrizes:** `AGENTS.md` indexa estritamente os 6 arquivos-canônicos na raiz de `docs/` (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`). Não existem subpastas (`docs/adr/` foi eliminada após consolidação integral) nem documentos vigentes fora destes 6.
2. **Não regressar o design:** tokens `telemetry-*` são obrigatórios; classes `bg-gray-*`, `bg-sky-*`, `bg-emerald-*` são proibidas nas páginas principais; rodar `pnpm test:design` antes de encerrar.
3. **Somente `pnpm`** (nunca `npm`).
4. **Código legado** (pré-2026-07-20) só sob feature/bug crítico/item de `TASKS.md` (Anexo B), com raio mínimo, teste de caracterização antes (`RULES.md` §7) e documentação no PR.
5. **Husky/lint-staged** estão no `package.json` mas `.husky/` não existe — hooks provavelmente inativos (`RULES.md` §4).

---

---

## 7. Histórico Recente de Entregas

- **2026-10-17:**
  - **Editar Placar direto (sem interrupção por Análise do Set):** Em [use-scoring-page-chrome.ts](file:///c:/apps/RKT/src/app/match/[id]/scoring/use-scoring-page-chrome.ts), inibida a abertura automática do modal `SetSummaryModal` durante o carregamento inicial da partida e quando no fluxo de edição de placar (`state.activeModal === 'edit-score'` ou `?modal=edit-score`). Garante transição imediata para o modal de edição de placar. Testes de regressão adicionados em `useScoringPageChrome.edit-score-modal.test.ts`.
  - **Droplist de Rodada e Simplificação em Editar Informações:** Em [edit-match-info-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-sections.tsx), substituído o campo de texto `<TextInput>` por `<SelectField>` com a lista de opções padronizadas de rodadas (`ROUND_OPTIONS`), mantendo fallback seguro para rodadas customizadas pré-existentes. Removidos os campos desnecessários do formulário: **Categoria**, **Chave** e **Tipo de Quadra** (em [edit-match-info-grid-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-grid-sections.tsx)), mantendo o layout enxuto e preservando valores pré-existentes no envio. Testes de componentes atualizados em `EditMatchInfoModal.test.tsx`.
  - **Winner jamais cadastrado como ACE via detalhes do ponto:** Em [useScoringHandlers.point-processor.service.ts](file:///c:/apps/RKT/src/hooks/useScoringHandlers.point-processor.service.ts), removida a conversão indevida que transformava pontos com `tipo === 'winner'` do sacador e `rallyLength === 1` em `ACE`. Um ACE é registrado exclusivamente direto em `/scoring` ou via modal de detalhes do saque (`ServerEffectModal`). Todo ponto cadastrado via modal de detalhes do ponto com `tipo === 'winner'` é registrado como `WINNER`. Teste de regressão adicionado em `useScoringHandlers.test.ts`.

---

## 8. Handoffs Sugeridos

- `@arquitetura → @backend`: resolver TD-003 (RLS) e TD-002 (Zod) — bloqueiam segurança e consistência de contrato.
- `@backend → @qa`: endpoints refatorados prontos para characterization/integração.
- `@frontend → @qa`: dual-theme + guardrails Telemetry prontos para `pnpm test:design` e E2E de tema.
- `@qa → @arquitetura`: decidir destino de `NEXT_PUBLIC_COMMENT_FEATURE` (TD-057) e PWA cancelada (item N8 em `docs/TASKS.md`).
- `@arquitetura → @frontend`: biblioteca de componentes em `src/components/ui` — requer decisão de escopo.

---

*Documento atualizado em 2026-10-28.*

---

## 2.5 Executado: PLANO_ALTERACOES_RKT_2026-10-27.md — 2026-10-28
- **Fase 1 – Nova partida (B1, B3):** rótulos "Simples"/"Duplas" (sem "1 vs 1"/"2 vs 2"); DateTimeSection sem bloco "Atenção" e sem asterisco em "Data"; remoção do preenchimento automático com hoje na criação; Data removida dos campos obrigatórios; `scheduledAt` fica indefinido sem data; preenchimento com hoje ao entrar em `IN_PROGRESS` (ponto único em `buildTransitionUpdateData`); verificação de efeito de `scheduledAt` nulo em dashboard (badge, ordenação) e duplicidade.
- **Fase 2 – Duplicidade (B2):** `findDuplicateMatch` recebe `matchType`, `player1PartnerId`, `player2PartnerId`; duplas comparadas como conjuntos de dois lados (qualquer ordem); simples nunca colide com dupla; chave do advisory lock inclui `matchType` e parceiros; `DuplicateMatchModal` exibe tipo (simples/duplas), data e texto "no mesmo dia".
- **Fase 3 – Nomes de dupla (C):** utilitário `abbreviateDoublesName` em `src/components/scoring/doubles-name-abbreviation.logic.ts`; `PlayerCard` exibe nome da dupla abreviado em uma linha (aria-label atualizado); `ScoreboardCard`/`ScoreboardPlayerRow` recebem `player1Partner`/`player2Partner` e usam o utilitário; `ScoringPlayArea` passa os parceiros.
- **Fase 4 – Card do dashboard (A):** regra do sobrescrito de tiebreak unificada e corrigida em `renderSetScore` (scoring) e `formatCompactSetScore` (dashboard): vencedor mostra só games, perdedor mostra games + pontos do TB em sobrescrito; Match Tiebreak mostra só o placar do TB sem sobrescrito; `getColumnTitles` para `BEST_OF_5` retorna Set 1 a 4 e TB; `MatchCard` reescrito usando a estrutura de tabela do `ScoreboardCard` com cores de quadra, suspenso, nomes de dupla abreviados e sem pontos do game; arquivos específicos do MatchCard (`MatchCardScore`, `MatchCardScoreTable`, etc.) deixados em desuso.
- **Fase 5 – Estatísticas avançadas (D3, D4, D8, D9, D10):** `BaselineStats` expõe `shortRallyWon/Total`, `mediumRallyWon/Total`, `longRallyWon/Total` (ganhos e total por faixa); `BaselineSection` mostra "Aproveitamento/Total (x/y)" e rótulos Curtos (1-4), Médios (5-8), Longos (9+); `advanced-stats-rally-section.tsx` e `advanced-stats-shot-section.tsx` com rótulos corrigidos; `stroke-matrix-classify.logic.ts` separa `approach_fh`/`approach_bh` (antes `aproachs`); `stroke-matrix-stats.logic.ts` com ordem Sq, FH, BH, VFH, VBH, SVFH, SVBH, Sm, Drop, Lob, Bate Pronto, Aproach FH, Aproach BH; `MomentumStats` com `streakCountP1/P2` (len2, len3, len4Plus); `advanced-stats-momentum.tsx` tabela de sequências exatas por jogador; `SetBreakdownSection` com linha de tempo total do jogo (`totalDurationMinutes`).
- **Validação:** `pnpm typecheck` 0 erros · `pnpm spec:validate` sem drift · `pnpm test:design` 3/3 (26/26) · `pnpm test` 397/397 suítes e 3904/3904 testes verdes.
