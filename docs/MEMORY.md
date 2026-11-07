# MEMORY — RKT (RKT App)

> Diário de bordo técnico · Metodologia RE-DOC (Fase 4 — Auditoria de Qualidade e Histórico)
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.

**Última Atualização:** 2026-11-06
**Analisado por:** engenharia reversa e implementação sobre `main`

---

## 2.22 Correção de Corte de Nomes/Clubes no Card e Alinhamento dos Testes de Logout — 2026-11-06
- **Problema 1 — Card do dashboard cortando nome e badge de clube:**
  - Em `src/components/dashboard/match-card-score-grid.tsx`, a coluna "Jogador" estava travada em `w-[110px] sm:w-[120px]` e, como a tabela usa `table-fixed`, o excedente de largura era distribuído igualmente entre as colunas de Sets — Set 1 recebia ~200px para exibir um dígito enquanto nome + badge ("Outros", "Criado por RKT") eram esmagados e cortados no meio da palavra.
  - **Correção:** inversão de prioridade de largura — colunas de Sets compactas e fixas (`w-7 sm:w-10 md:w-11`), Pontos `w-11 sm:w-12`, bola `w-6`, e a coluna do Jogador sem largura fixa (absorve 60-70% do card); nome com `truncate min-w-0 flex-1` + tooltip `title` e badge com `shrink-0` (nunca corta a palavra, corta o nome com reticências). Alteração embarcada no commit `f01ccdd` (2026-11-04).
- **Problema 2 — Testes de logout desatualizados em relação ao fluxo da seção 2.19:**
  - O fluxo real é `await performLogout()` → `POST /api/auth/logout` + `clearAuthState()` → `window.location.replace('/login?exit=1')`, e `redirectToLogin` (`src/lib/auth-client-storage.ts`) faz o mesmo POST antes de navegar. Três suítes ainda esperavam o comportamento antigo (`router.replace('/login')` e `fetch` nunca chamado).
  - **Nenhuma mudança em código de produção** — apenas testes:
    - `src/app/dashboard/__tests__/HamburgerMenu.test.tsx`: o teste força o ramo de produção (mock de `window.location` + `process.env.NODE_ENV !== 'test'`, restaurado no `afterEach`) e usa `waitFor` porque `confirmLogout` é `async`; asserções: `POST /api/auth/logout` → `clearAuthState()` → `window.location.replace('/login?exit=1')`, sem `router.replace('/login')`. Teste de cancelar também afirma que o POST de logout não dispara.
    - `src/app/dashboard/__tests__/dashboard.hooks.test.tsx`: sem `access_token` a única requisição é o `POST /api/auth/logout` (nenhuma busca de partidas) + redirect `/login?exit=1`.
    - `src/app/dashboard/__tests__/dashboard.hooks.guards.test.tsx`: guard de token expirado agora espera `'/login?exit=1'` e o POST de logout (antes afirava `fetch` nunca chamado).
- **Correções de testes pré-existentes encontradas na varredura completa da suíte:**
  - `src/app/admin/__tests__/page.confirm-dialog.test.tsx` e `src/app/match/[id]/report/__tests__/report-page.test.tsx`: mock de `next/navigation` incompleto (`useRouter` sem `usePathname`), quebrado pela migração de `DashboardChrome`/`ReportPage` para `useAreaPath()` → `useActiveArea()` → `usePathname()`. Adicionado `usePathname` nos dois mocks.
  - `src/services/__tests__/playerService.test.ts`: expectativa do `select` de `listPlayers` defasada em relação a `player-service-queries.logic.ts` (campos `city`, `state`, `createdAt` adicionados sem atualizar o teste).
- **Validação:** `pnpm test` (suíte completa) → **488 suítes / 4405 testes / 2 snapshots verdes**; `next lint` sem warnings.

---

## 2.21 Duplas Just-in-Time, Ponto Decisivo No-Ad e Edição Ágil de Sacador — 2026-11-04
- **Contexto & Problema:**
  - Em testes com usuários reais (anotadores e treinadores), o início de duplas exigia antecipadamente a escolha dos sacadores de ambas as duplas, violando a Regra 14 da ITF (onde a dupla recebedora só define quem saca no Game 2).
  - Em formatos No-Ad no 40-40 (ponto decisivo), não havia forma rápida de marcar quem recebia o serviço decisivo.
  - Se o anotador errasse o sacador inicial, não era possível editar o sacador sem reiniciar a partida inteira.
- **Pilar 1: Duplas Just-in-Time (Regra 14 ITF):**
  - `DoublesServerSelectionModal.tsx` e `doubles-serve-order-section.tsx` simplificados para coletar exclusivamente o primeiro sacador da dupla que começa no saque (`servingSide`). A outra dupla recebe aviso visual de que seu sacador será escolhido no Game 2.
  - Micro-modal `Game2ServerSelectionModal.tsx` integrado a `ScoringSessionModals.tsx`, disparado no início do Game 2 com 1 toque para escolher o sacador da dupla B, consolidando a rotação oficial para todo o set.
- **Pilar 2: Ponto Decisivo No-Ad (40-40):**
  - Reconhecimento automático de ponto decisivo em formatos sem vantagem via `isNoAdDecidingPoint`.
  - Banner interativo no `ScoringPlayArea.tsx` exibindo os dois recebedores da dupla que devolve, permitindo alternar com 1 toque o atleta que recebe o ponto decisivo (`activeReceiverId`), integrando diretamente com `PointDetailsModal`.
- **Pilar 3: Edição / Troca Ágil de Sacador em Qualquer Momento (Tolerância a Erro):**
  - Ícone da bolinha (`🎾`) no `PlayerCardRow.tsx` / `PlayerCard.tsx` com `role="button"` e cursor clicável, acionando o `ChangeServerModal.tsx` (inversão em Simples e seletor dos 4 atletas em Duplas).
  - Botão de recuperação rápida pós-undo ou no início do game no `0-0` em `PlayAreaPlayers.tsx` ("Corrigir Sacador").
  - Seção dedicada e visível no modal de edição de placar (`EditScoreServerSection.tsx` integrado a `EditScoreModalContent.tsx`) para retificar o sacador ativo do game.
  - Core: `applyGameServerChange` em `game-server-change.logic.ts` e `engine.setGameServer(serverId)` com sincronização no Game 1 via `createServerChangeService`.
- **Testes & Qualidade:**
  - Suítes dedicadas `ChangeServerModal.test.tsx`, `game-server-change.test.ts`, `DoublesServerSelectionModal.characterization.test.tsx` e `engine-from-serialized.initial-server.regression.test.ts` 100% verdes.
  - TypeScript estrito (`tsc --noEmit`) 0 erros.

---

## 2.20 Estatísticas Avançadas, Timeline MT, Responsividade de Atletas e Vínculo de Treinador Avulso — 2026-11-04
- **Estatísticas Avançadas (EA):**
  - Colunas centrais de métricas em `advanced-stats-primitives.tsx` e `advanced-stats-stroke-matrix-section.tsx` alargadas (`grid-cols-[1fr_minmax(180px,280px)_1fr] sm:grid-cols-[1fr_280px_1fr]` e `gap-3 sm:gap-4`) sem truncamento de texto, prevenindo corte dos critérios.
  - Tópico 10 (Breakdown por set) removido por completo de `AdvancedStats.tsx`.
  - Tópico 7 (Definição de ponto): Aces integrados à contagem de Winners e Duplas Faltas (DFs) integradas à contagem de Erros Não Forçados (ENF). Rótulo simplificado para "Winners".
  - Tópico 9 (Momentum): Removidos o bloco central de "Sequência atual" e o rodapé de "Sequências de 2+ Pontos"; tabela renomeada para "2 pontos ganhos seguidos", "3 pontos ganhos seguidos", "4+ pontos ganhos seguidos".
  - Tópico 6 (Pontos de Pressão): Inclusão da palavra "Won" ("Games Points Won", "% Games Points Won", "Set Points Won", "% Set Points Won", "Tiebreaks Won").
  - Tópico 2 (Devolução): Removidos "Total Break points" e "Break points Won"; ordem reestruturada para: % Devolução 1º saque em quadra, % pontos ganhos na devolução de 1º saque, % dev 2º saque em quadra, % pontos ganhos na dev 2º saque, Games ganhos devolvendo.
  - Tópico 3 (Fundo de Quadra): Restrito estritamente a pontos com `situacao === 'fundo'`, mantendo abrangência total em Rally Geral.
- **Timeline e Relatório (/report) em Match Tiebreak (MT):**
  - Supressão de detecção de fim de game a cada ponto em `timeline-game-end.ts` durante tiebreak.
  - Remoção de linhas divisórias (`GameEndRow`) entre pontos em MT.
  - Coluna 'GAMES' omitida em `MATCH_TB_10` na timeline.
  - Marcador de quebra de serviço no tiebreak renomeado para "Minibreak".
  - Resumo de sets computa vencedor de MT (`1 - 0` no relatório finalizado).
- **Criação de Atleta & Vínculo Treinador Avulso:**
  - `POST /api/players` e `player-create.logic.ts` permitem criação com `myClub: true` para treinador avulso sem CT, estabelecendo vínculo via `CoachAthleteLink` ativo.
  - Herança do slot `isParticular` em `MatchNewModals.tsx` e `use-new-athlete-modal.ts`.
- **Tabela de Atletas & Dashboard:**
  - Layout compacto e responsivo em `AthleteListTable.tsx` com inclusão das colunas Clube e Cidade / UF.
  - Descrição do modo de jogo no Dashboard alinhada à esquerda e com nomenclatura oficial completa sem abreviações.
- **Testes & Qualidade:**
  - Suíte `AdvancedStats.characterization.test.tsx` criada e 100% verde (50 suítes de relatórios passando).
  - `tsc --noEmit` 0 erros.

---

## 2.19 Correção do Logout no Menu Hambúrguer em /suporte — 2026-11-02
- **Sintoma:** em `/suporte`, ao clicar no menu hambúrguer e depois em "Sair", o logout falhava ou a tela de login aparecia mantendo a URL `/suporte`.
- **Causa Raiz:**
  1. O painel do suporte passa `<DashboardChrome title="Painel do Suporte" showLogout={false} />` para não renderizar o botão "Sair" na barra superior (`DashboardTopBar`). No entanto, `DashboardChrome.tsx` condicionava a renderização do diálogo de confirmação (`ConfirmAlertDialog`) a `{showLogout && !onLogout && (...)}`. Como `showLogout` era `false`, o clique em "Sair" no menu hambúrguer abria o estado mas o diálogo não existia na DOM.
  2. Em `DashboardChrome.tsx`, `confirmLogout` executava `performLogout().catch(...)` de forma assíncrona sem `await`, navegando imediatamente via `router.replace('/login')` e `window.location.href = '/login'`. O cookie httpOnly `rkt_access_token` ainda estava ativo na requisição para `/login`. O middleware, ao detectar usuário autenticado acessando `/login`, aplicava o redirecionamento 307 de volta para a home da área ativa (`/suporte`), gerando uma colisão onde a tela de login renderizava com URL `/suporte`.
  3. `login-success.logic.ts` não validava se o destino do query param `next` era compatível com os papéis do usuário autenticado (ex.: redirecionar para `/suporte` conta avulsa).
- **Resolução Implementada:**
  - `src/app/dashboard/components/DashboardChrome.tsx`:
    - `<ConfirmAlertDialog>` é montado sempre que `!onLogout`, permitindo que o menu hambúrguer conclua o fluxo.
    - `confirmLogout` agora é `async`, aguarda `await performLogout()` para que a rota `/api/auth/logout` limpe os cookies httpOnly no servidor antes de navegar.
    - Navegação com `window.location.replace('/login?exit=1')`, ativando a limpeza segura forçada pelo middleware sem redirecionamento para `homeForArea`.
  - `src/lib/auth-client-storage.ts`: `redirectToLogin` padronizado para `/login?exit=1`.
  - `src/app/login/login-success.logic.ts`: valida áreas protegidas (`/suporte`, `/admin`, `/gestor`) contra os acessos reais da conta recém-autenticada, prevenindo desvios para áreas indevidas.
- **Testes:**
  - `src/app/dashboard/components/__tests__/DashboardChrome.menu.test.tsx`: valida que mesmo com `showLogout={false}`, o clique em "Sair" no menu hambúrguer abre com sucesso o diálogo de confirmação de logout.
  - `src/app/login/__tests__/login-success.test.ts`: 7 testes cobrindo redirecionamentos por perfil e bloqueio de `next=/suporte` para contas sem permissão de suporte.

---

## 2.18 Filtro 'Meu atleta' e 'Outros' no Modal Nova Partida (/match/new) — 2026-11-02
- **Sintoma:** ao abrir o modal Nova Partida (`/match/new`) como treinador particular/avulso, selecionar "Meu atleta" listava todos os atletas do sistema; o botão "Outros" também listava todos os atletas com o nome do clube exibido.
- **Causa Raiz:**
  1. Em `src/app/match/new/slot-affiliation.ts`: quando `affiliation === 'OWN'` e `!target` (modo particular sem CT), se `followedPlayerIds` estivesse vazio ou não correspondesse, caía no fallback `return athletes;` (retornando todos os atletas do sistema).
  2. Em `src/app/api/auth/me/route.ts`: `followedPlayerIds` consultava apenas `dbUser.coachAthleteLinks`, omitindo `createdPlayers` (atletas cadastrados diretamente pelo treinador avulso via `/api/players`).
  3. Em `src/app/match/new/useNewMatchState.ts`: `loadAvailableCts` preenchia `ctId` com o primeiro CT retornado (`cts[0].id`), forçando inadvertidamente o modo de CT mesmo em contexto `PARTICULAR`.
  4. Em `src/app/match/new/components/my-club-selector.tsx`: `MyClubSelector` não verificava `isParticular` e renderizava o seletor de CT do clube.
- **Resolução Implementada:**
  - `src/app/match/new/slot-affiliation.ts`: corrigido `filterAthletesForSlot` para retornar estritamente `athletes.filter((a) => followedPlayerIds.includes(a.id))` em `OWN` sem CT (retorna lista vazia caso o treinador não tenha atletas vinculados, jamais todos os atletas). Em `NOT_OWN` sem CT, exclui os atletas vinculados de `followedPlayerIds`.
  - `src/app/api/auth/me/route.ts`: `followedPlayerIds` une `coachAthleteLinks` e `createdPlayers` (`dbUser.createdPlayers.map(p => p.id)`).
  - `src/services/access-actor.logic.ts` + `accessService.ts`: `filterFollowedPlayers` incorpora `createdPlayers` no ator, isolando atletas de CTs quando no modo avulso/particular.
  - `src/app/match/new/components/PlayerSelection.tsx`: calcula `effectiveCtId = isParticular ? null : (ctId || null)`.
  - `src/app/match/new/components/my-club-selector.tsx`: retorna `null` quando `isParticular` é verdadeiro.
  - `src/app/match/new/useNewMatchState.ts`: garante que em modo `PARTICULAR` o `ctId` permanece vazio (`''`), encadeando `loadAvailableCts` após a leitura do contexto em `/api/auth/me`.
  - `src/app/match/new/useNewMatchSelectionActions.ts`: novos atletas criados na hora pelo treinador no modal são adicionados reativamente ao `followedPlayerIds`.
- **Testes:**
  - `src/app/match/new/__tests__/slot-affiliation.characterization.test.ts`: 14 testes cobrindo `OWN`/`NOT_OWN` com e sem `ctId` e com `followedPlayerIds`.
  - `src/app/match/new/__tests__/PlayerSelection.characterization.test.tsx`: 7 testes cobrindo renderização, labels `Meu atleta` e `Outros` e filtragem isolada por slot.
  - 100% de testes verdes em toda a suíte de match e access.

---

## 2.17 Plano da Landing Page Institucional e Captação — 2026-11-01
- **Origem:** Demanda de divulgação institucional e captação de usuários segmentada por perfis.
- **Diretório da LP:** [`c:\apps\RKT-LP`](file:///c:/apps/RKT-LP)
  - Plano mestre salvo em: [`c:\apps\RKT-LP\PLANO_LANDING_PAGE.md`](file:///c:/apps/RKT-LP/PLANO_LANDING_PAGE.md).
  - Ponto de entrada e referências: [`c:\apps\RKT-LP\README.md`](file:///c:/apps/RKT-LP/README.md).
- **Referências Canônicas:**
  - Fonte única de verdade para Design System, tokens `telemetry-*`, regras R-03 ($\le 100$ linhas), tipos de telemetria esportiva e fluxos de autenticação (`/signup` com `?perfil=` e `?origem=`) é o sistema principal em `c:\apps\RKT`.
- **Decisões Arquiteturais:**
  1. A Landing Page é servida na raiz `/` para visitantes anônimos.
  2. Usuários já autenticados que acessarem `/` são direcionados para a home da sua área semântica ativa (`homeForArea(activeArea)`).
  3. Os CTAs segmentam por perfil (`ATLETA`, `TREINADOR`, `GESTOR`, `ESPECTADOR`) com tags de auditoria (`origem=lp_*`).

---

## 2.16 Layout das Subseções de Ranking em 2 Linhas (Sem Scroll Horizontal) — 2026-11-01
- **Sintoma:** no cadastro de novo atleta (seção "2. Ranking", usada também no Editar Atleta), cada subseção (Estadual, COSAT etc.) renderizava **Categoria, Classe, Posição e Posição Ranking Juvenil numa única linha** (`flex flex-nowrap` + `overflow-x-auto`), forçando barra de rolagem horizontal — UX péssima em telas estreitas.
- **Causa Raiz:** `src/app/atletas/ranking-form-card.tsx` envolvia os campos em `<div className="flex flex-nowrap ... overflow-x-auto">` e `RankingFields` devolvia todos os campos como irmãos inline.
- **Resolução Implementada:**
  - `src/app/atletas/ranking-form-card.tsx`: container vira `flex items-start` simples (sem `flex-nowrap`/`overflow-x-auto`).
  - `src/app/atletas/ranking-form-fields.tsx`: campos reorganizados em **duas linhas** com `grid grid-cols-2`:
    - **Linha 1:** Categoria + Posição (para tipos sem categoria, ex. adulto em ESTADUAL, a **Classe sobe** para a linha 1 junto da Posição);
    - **Linha 2:** Classe + Posição Ranking Juvenil (renderizada só quando faz sentido — categoria juvenil).
  - Novos componentes extraídos para respeitar R-03 (≤100 linhas): `ranking-field.tsx` (label + controle), `ranking-select-field.tsx` (select rotulado, sufixo " anos" para categorias) e `ranking-number-field.tsx` (input numérico de Posição). Tokens telemetry preservados.
  - Impacto: vale para **todos** os consumidores de `RankingForm` — cadastro de atleta em `/match/novo` ("2. Ranking") e modal "Editar Atleta" em `/atletas`.
- **Testes:** `src/app/atletas/__tests__/RankingForm.real.test.tsx` — asserts de layout atualizados para as 2 linhas (`.grid.grid-cols-2`), novo caso "adulto sem categoria: Classe + Posição juntas na linha 1 e sem linha 2" e regressão de ausência de `.overflow-x-auto`. Suítes `RankingForm|EditAthleteModal|NewAthleteModal` verdes (47 testes).
- **Qualidade:** `tsc --noEmit` 0 erros · `next lint` 0 avisos · arquivos ≤100 linhas (R-03).

## 2.15 "Link Senha" do Gestor Cria a Conta de Atletas Sem Conta — 2026-11-01
- **Sintoma:** em `/gestor` → aba **Atletas**, clicar em **"Link Senha"** retornava `404 { error: 'NOT_FOUND', message: 'Vínculo de atleta não encontrado' }`; após a primeira correção, o mesmo clique devolvia `409 CONFLICT` quando o CPF do atleta já tinha conta.
- **Causa Raiz:**
  1. O `PlayerCT` existia e estava `ACTIVE`; o 404 era disparado por `!playerCt.player.user || !playerCt.player.userId`. Atletas vinculado ao CT **sem conta de acesso** (`Player.userId` nulo — cadastro rápido em partida `PROVISIONAL` ou vínculo avulso via `/api/cts/[id]/athletes`) apareciam com o botão ativo e não tinham como gerar link.
  2. O CPF é a chave de identidade, mas **só os treinadores** tinham fluxo de vinculação de conta já existente (`linkExistingCoach`, acionado pelo prompt do cadastro). Para atletas, `createAthleteByGestor` devolvia `conflict: true` e o modal ignorava (`canLinkExisting` só era tratado para treinador). Caso real no banco local: atleta *Marcos* (nascimento 2015-01-01) com CPF igual ao da conta `Coah Carter`.
- **Resolução Implementada:**
  - `src/app/api/gestor/athletes-link.logic.ts` (novo): `linkExistingAthleteAccount()` — espelho de `linkExistingCoach`. Recusa se a conta já pertence a outro `Player` (`409`), cria/associa o `Player` da conta, garante `PlayerCT` **ACTIVE** (reativa vínculo encerrado em vez de duplicar), propaga `CoachAthleteLink` para os treinadores do CT, grava `AuditLog` (`ATHLETE_LINKED_TO_CT`) e invalida o cache do ator. Aplica a regra "cadastrado pelo clube pertence ao clube".
  - `src/app/api/gestor/athletes-provision.logic.ts` (novo): `provisionAthleteAccount()` movida para cá (R-03). Valida CPF/nascimento, **vincula a conta de mesmo CPF** ou cria o `User` (`ANNOTATOR`, `canOperate`, senha provisória = data de nascimento `YYYYMMDD`, 7 dias) associando `Player.userId` + `identityStatus: 'CONFIRMED'`. E-mail de outra conta → `409`; corrida `P2002` → `409`.
  - `src/app/api/gestor/athletes/[id]/regenerate-link/route.ts`: o 404 passa a valer apenas para vínculo inexistente; sem conta, provisiona/vincula na hora e segue o fluxo normal (`LinkInvite` + `PasswordResetRequest` + token).
  - `src/app/api/gestor/athletes-logic.ts`: `createAthleteByGestor` aceita `linkExisting` — sem ele devolve `canLinkExisting`/`existingUserName` (prompt de confirmação); com ele chama `linkExistingAthleteAccount` e responde `isExistingUser: true` sem nova senha.
  - `src/lib/validators/athlete-create.schema.ts` + `src/app/api/gestor/athletes/route.ts`: `linkExisting` no schema e no payload de conflito/sucesso (mesmo formato da rota de treinadores).
  - `src/app/gestor/cadastrar-membro-modal.tsx` e `cadastrar-membro-link-prompt.tsx`: envia `linkExisting` também para atleta e prompt com copy própria ("vincular a conta ao seu clube" / "integrar o elenco").
  - `src/app/gestor/athlete-row.tsx`: badge **"Sem conta"** e título do botão "Criar conta de acesso e gerar link de senha".
- **Testes:**
  - `src/app/api/gestor/athletes/[id]/__tests__/regenerate-link.test.ts` (8 casos: conta existente, provisionamento, vínculo por CPF, 404, 400 nascimento, 400 CPF, 409 outro atleta, 409 e-mail de outra conta).
  - `src/app/api/gestor/__tests__/athletes-link.test.ts` (5 casos) e `coaches-athletes.test.ts` (+2 casos de `linkExisting`).
  - `src/app/gestor/__tests__/athlete-row.test.tsx`, `athletes-table-link-senha.test.tsx` e `cadastrar-membro-modal-link.test.tsx`.
- **Qualidade:** `tsc --noEmit` 0 erros · `next lint` 0 avisos · suítes Jest de gestor verdes (73 testes).

---

## 2.12 Área Ativa e Roteamento Semântico por URLs (Fases 0 a 7 Concluídas) — 2026-11-01
- **Origem:** Plano [`docs/PLANO_AREAS_ATIVAS_E_URLS_POR_AREA_2026-11-01.md`](docs/PLANO_AREAS_ATIVAS_E_URLS_POR_AREA_2026-11-01.md).
- **Fase 0 (Spike de Compatibilidade App Router Next.js 15.3):**
  - Documentado em [`docs/SPIKE_NEXTJS_URL_REWRITE.md`](docs/SPIKE_NEXTJS_URL_REWRITE.md).
  - Comprovada a preservação da URL externa visível via `usePathname()`, integridade da navegação SPA com `<Link>` e funcionamento transparente da pilha de modais (`useRouterModalStack`).
- **Fase 1 (Claims de Sessão, Token & Refresh):**
  - `src/lib/jwt-client.ts`: Suporte aos novos claims de área `ax` (área ativa), `ct` (clube ativo) e `ars` (áreas disponíveis).
  - `src/core/access/areas.ts`: Funções puras `listAreas`, `prefixForArea`, `homeForArea` mapeando todas as 8 áreas canônicas.
  - `src/app/api/auth/refresh`: Refatorado com `refresh-token.logic.ts` para preservação integral e sem perdas de `sub`, `role`, `sv`, `mcp`, `pp`, `mk`, `cx`, `ax`, `ct` e `ars`.
  - `src/app/api/auth/area`: Rota e lógica `switchUserArea` permitindo alternância de área ativa com validação de vínculo e gravação no `AuditLog`.
  - `src/lib/feature-flags.ts`: Feature flag `isAreaUrlsEnabled()` controlada por `AREA_URLS`.
- **Fase 2 (Middleware & Camada de Roteamento):**
  - `src/core/access/app-path.logic.ts`: Helper puro `appPath(area, path)` resolvendo caminhos de todas as áreas com preservação de rotas neutras.
  - `src/middleware-area.logic.ts`: Reescrita transparente (`NextResponse.rewrite`) de rotas com prefixo (`/treinador`, `/atleta`, etc.) para rotas internas do App Router (`/dashboard`, `/partidasaovivo`, `/match/new`, etc.), e redirecionamento temporário 307 de rotas legadas não prefixadas.
  - `src/middleware.ts` e `src/middleware-auth.logic.ts`: Atualizados com expansão do matcher incluindo `/login`, `/clube/:path*`, `/treinador/:path*`, `/atleta/:path*`, `/anotador/:path*`, `/espectador/:path*` e `/escolher-area`.
- **Fase 3 (Isolamento por Área no Servidor):**
  - `src/services/access-actor.logic.ts`: `buildActor` com suporte a `activeArea`. No contexto `TREINADOR_AVULSO` ou `contextId: 'PARTICULAR'`, filtra estritamente atletas avulsos e nega vínculos de clube; em `ATLETA`, omite papéis de gestão/treinador.
  - `src/services/accessService.ts`: `getActor` aceita e indexa cache de ator por `activeArea`.
  - `src/lib/auth-credentials.logic.ts` e `src/lib/access-handler.ts`: Extração de `x-active-area` e `x-active-ct` injetando ator contextualizado em todas as rotas protegidas.
  - `src/core/access/visibility.ts`: Filtro estrito de visibilidade em `canReadMatch` e `canAnnotateMatch` por `Match.ctId` e contexto ativo.
- **Fase 4 (Migração de Links e Teste-Guarda):**
  - `src/hooks/use-area-path.ts`: Hook cliente reativo `useAreaPath()` detectando área da rota atual e gerando caminhos semânticos.
  - `DashboardChrome.tsx`, `useDashboardNavigation.ts` e `useNewMatchSubmissionActions.ts`: Atualizados com roteamento por área.
  - `src/__tests__/area-links.guard.test.ts`: Teste-guarda de integridade validando que nenhum link prefixável escapa do padrão.
- **Fase 5 (UI, Escolha de Área e Limpeza Offline):**
  - `src/app/escolher-area/page.tsx` e `use-area-selection.ts`: Interface de seleção de áreas disponíveis com redirect automático se conta possuir apenas 1 área.
  - `src/lib/offline-storage-purge.ts`: Limpeza de caches IndexedDB (`racket_pending_matches` e `racket-offline-db`) ao alternar contexto/área.
  - `src/components/ui/context-switcher.tsx`: Integrado `purgeOfflineCaches()` na alternância de contexto do menu.
- **Fase 6 (Páginas Públicas, Segurança & Parâmetro next):**
  - `src/core/access/safe-redirect.logic.ts`: Sanitização rigorosa contra Open Redirect (CWE-601) em `next` com testes dedicados em `safe-redirect.test.ts`.
  - `src/app/login/login-success.logic.ts`: Redirecionamento seguro após autenticação para `/escolher-area` (múltiplas áreas) ou rota semântica da área ativa (`/treinador`, `/atleta`, etc.).
  - `src/app/match/[id]/report/page.tsx` e `src/app/match/[id]/scoring/page.tsx`: Adoção de `useAreaPath()` nos retornos contextuais de relatório e pontuação.
- **Fase 7 (Homologação Final & Baseline Verde):**
  - 100% dos novos arquivos com $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 avisos / 0 erros (`✔ No ESLint warnings or errors`).
  - Baseline de testes Jest: 38 testes específicos da funcionalidade passando + suíte global verde.

---

## 2.14 Correção do Fluxo de Troca de Senha, Logout e Escape Hatch em /trocar-senha — 2026-11-01
- **Causa Raiz Identificada:**
  1. *Logout no Menu Hambúrguer e Header*: O botão "Sair" limpava apenas o estado no `sessionStorage`/`localStorage`, mas não invocava `POST /api/auth/logout`, deixando o cookie `rkt_access_token` (`HttpOnly`) persistido.
  2. *Bloqueio em /trocar-senha*: O usuário logado com senha provisória tem o claim `mcp: true` no cookie. O middleware forçava redirecionamento de volta para `/trocar-senha`. Ao tentar navegar para o login ou caso a senha provisória estivesse expirada/esquecida, o usuário ficava preso em loop na tela sem conseguir acessar nenhuma outra conta.
- **Resolução Implementada:**
  - `src/lib/auth-client-logout.ts`: Criado módulo isolado (23L) com `performLogout()` que faz `POST /api/auth/logout` para expirar cookies `HttpOnly` no servidor e limpa a sessão cliente.
  - `src/app/dashboard/components/DashboardChrome.tsx`: Integração de `performLogout()` e `clearAuthState()` na confirmação do alertdialog de logout.
  - `src/app/api/auth/login/route.ts`: Quando `user.mustChangePassword === true`, o cookie `rkt_access_token` é emitido como cookie de sessão (sem `maxAge`), sendo descartado ao fechar o navegador.
  - `src/middleware-auth.logic.ts`: Se um usuário com `decoded.mcp === true` acessa a raiz `:3000` ou `/login`, o middleware limpa e expira os cookies pendentes e exibe a tela de login livremente, enquanto rotas protegidas (`/dashboard`, `/treinador`, etc.) continuam exigindo a troca de senha.
  - `src/middleware-auth.logic.ts`: Adicionado suporte a `exit=1` em `/login?exit=1`, limpando e expirando cookies no ato e exibindo a tela de login sem loop de redirecionamento.
  - `src/app/trocar-senha/components.tsx` e `src/app/trocar-senha/page.tsx`:
    - Adicionado escape hatch com botões de saída ("Sair desta conta e voltar ao login" no alerta de erro e "Sair e fazer login" no rodapé).
    - O botão "Ir para o Login" na tela de sucesso chama `performLogout()` e navega para `/login?exit=1`.
  - Testes dedicados em `src/lib/__tests__/auth-client-logout.test.ts`, `src/app/trocar-senha/__tests__/trocar-senha.test.tsx` e `src/middleware/__tests__/middleware.test.ts`.
  - R-03 respeitado: todos os arquivos mantidos com $\le 100$ linhas.
  - `src/app/trocar-senha/components.tsx`: Componente `TrocarSenhaSuccess` atualizado para acionar `onLoginClick` de forma explícita no botão "Ir para o Login".
  - `src/app/trocar-senha/__tests__/trocar-senha.test.tsx`: Teste unitário criado para garantir o comportamento de sucesso e disparo da navegação.
- **Qualidade & STE-DEV:**
  - `change-password/route.ts` (92L), `reset-password/route.ts` (50L), `trocar-senha/page.tsx` (98L), `trocar-senha/components.tsx` (98L) — 100% $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 erros / 0 avisos.
  - Testes: 100% verdes.

---

## 2.13 Correção do Fluxo de Logout no Header e Menu Hambúrguer — 2026-11-01
- **Causa Raiz Identificada:** O cookie de autenticação `rkt_access_token` é definido com `httpOnly: true`. A rotina de logout anterior executava apenas `clearAuthState()`, limpando o `sessionStorage` e tentando `document.cookie` (ineficaz para cookies `HttpOnly`). Sem a chamada ao endpoint `POST /api/auth/logout`, o cookie permanecia no navegador. Ao tentar redirecionar para `/login`, o middleware detectava a sessão ainda ativa e redirecionava imediatamente de volta para a rota da área ativa (`/suporte`, `/dashboard`, etc.).
- **Resolução Implementada:**
  - `src/lib/auth-client-logout.ts`: Criado módulo puro `performLogout` que dispara `fetch('/api/auth/logout', { method: 'POST' })` para invalidação dos cookies `HttpOnly` no servidor, seguido de `clearAuthState()`.
  - `src/lib/auth-client.ts`: Exportada a função `performLogout`.
  - `src/app/dashboard/components/DashboardChrome.tsx`: `confirmLogout` atualizado para despachar `performLogout()`, `clearAuthState()`, `router.replace('/login')` e navegação de página completa com `window.location.href = '/login'`.
  - `src/lib/auth-client-storage.ts`: `redirectToLogin()` atualizado para também acionar `fetch('/api/auth/logout', { method: 'POST' })`, evitando retenção inadvertida de cookies ao expirar tokens.
  - `src/lib/__tests__/auth-client-logout.test.ts`: Cobertura unitária completa do novo fluxo.
- **Qualidade & STE-DEV:**
  - Limite de linhas estritamente respeitado (R-03): `DashboardChrome.tsx` (99L), `auth-client-storage.ts` (95L), `auth-client-logout.ts` (23L).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 erros / 0 avisos.
  - Testes: 100% verdes (3/3 suítes de logout e menu hambúrguer passando).

---

## 2.11 Auditoria & Homologação: LGPD, Proteção de Menores e Governança — 2026-11-01
- **Origem:** Plano [`docs/PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md`](docs/PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md).
- **Fase 1 (Proteção de Menores na Transmissão):**
  - `src/core/spectate/spectator-projection.ts`: Parâmetro `broadcastConsentPlayerIds` obriga mascaramento para iniciais (`A. S.`) de menores sem autorização ativa.
  - `src/services/spectator-feed.service.ts` e `builder`: Repasse de consentimentos ativos.
  - `/api/spectate/[matchId]/feed`: Consulta `ConsentRecord` com `purpose: 'BROADCAST'` e `revokedAt: null`.
  - Telas públicas `/matches/convite/[token]` e `/matches/acompanhar/[matchId]`: Botão "Voltar ao início" aponta para `/`.
- **Fase 2 (Direitos dos Titulares - Art. 18 LGPD):**
  - `user-anonymize.logic.ts`: Ofuscação em cascata de `User` e `Player` dentro de `$transaction`.
  - `/api/users/[id]/anonymize`: Consome logic e audita com `meta: { playerId }`.
  - `user-export.logic.ts` e `/api/users/[id]/export`: Exportação completa com histórico e adversários minimizados.
- **Fase 3 (Fluxo Seguro de Tutela):**
  - `/api/guardians/consent`: Endpoint com validação estrita de `GuardianLink` confirmado, checagem de `isMinor`, bloqueio de auto-consentimento pelo menor e auditoria com `ipHash`.
- **Fase 4 (Onboarding & Páginas Legais):**
  - Páginas públicas `/termos` e `/privacidade` no padrão broadcast telemetry.
  - `/signup`: Leitura de `?perfil=` com whitelist, `?origem=`, checkbox obrigatório com links legais e gravação de `TERMS_ACCEPTED` no `AuditLog`.
- **Qualidade & Baseline:**
  - 100% dos 16 arquivos com $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 avisos / 0 erros (`✔ No ESLint warnings or errors`).
  - Suítes de testes de signup e spectate: 100% verdes (4/4 signup com 16 testes; 7/7 spectate com 26 testes).

---

## 2.10 Otimização Mobile do Anotador e do Espectador — 2026-10-31
- **Anotador (`/match/[id]/scoring`):**
  - **Eliminação de delay e zoom duplo:** Adicionado `touch-manipulation` em botões de ação e no layout da página de pontuação.
  - **Prevenção de rebotes e overscroll:** `overscroll-none` e `select-none` no container principal impedem recarregamento por pull-to-refresh acidental e seleção indesejada de texto durante anotação veloz.
  - **Feedback háptico (R-13):** Adicionado `triggerHaptic(20)` e `triggerHaptic(40)` com `navigator.vibrate` protegido por feature detection no `use-player-card-touch.ts`.
  - **Modo Sol Forte (High-Contrast Outdoor):** Em `PlayerCard.tsx` e `player-card-row.tsx`, anel de sacador reforçado (`ring-[3px] ring-telemetry-volt shadow-[0_0_12px_rgba(var(--telemetry-volt)/0.35)]`), bordas nítidas `border-telemetry-border/30 dark:border-white/10 shadow-sm` e tipografia `font-black tracking-tight drop-shadow-sm` para legibilidade máxima sob luz solar direta em quadra aberta.
- **Espectador (`/matches/acompanhar/[matchId]`):**
  - **Placar Sticky:** `SpectatorScoreboard.tsx` com `sticky top-0 z-20 bg-telemetry-card/95 backdrop-blur-sm` mantendo os sets e games visíveis mesmo ao rolar a timeline de pontos no celular.
  - **Wake Lock da Tela:** Hook `use-wake-lock.ts` mantendo a tela do smartphone ativa enquanto a partida estiver `LIVE` ou `CATCH_UP` via Screen Wake Lock API (`navigator.wakeLock.request('screen')`). Reativação automática com `visibilitychange` ao retornar à aba.
  - **Toggle Visual de Bateria para o Wake Lock:** Componente `SpectatorWakeLockToggle.tsx` e hook `use-spectator-wake-lock-preference.ts` permitindo ao espectador alternar entre "Tela sempre acesa" e "Economia de bateria (tela apaga)", com preferência persistida localmente.
  - **Microanimação no Último Ponto:** Indicador pulsante em tempo real no `SpectatorLastPointBanner.tsx` com `animate-ping` e chave de animação por ponto.
  - **Responsividade e Viewport:** Otimização do container em `page.tsx` com padding responsivo (`p-2 sm:p-4`) e `touch-manipulation`.
- **Qualidade STE-DEV:**
  - 100% dos arquivos com $\le 100$ linhas (R-03).
  - Baseline de testes Jest: 100% verde (7 suites, 26 testes em spectate; suítes de scoring aprovadas).
  - Tipagem TypeScript: `tsc --noEmit` com 0 erros.

---

## 2.7 Acompanhamento de Partidas ao Vivo (Transmissão Espectador) — 2026-10-29
- **Origem:** Plano `docs/PLANO_ACOMPANHAMENTO_PARTIDAS_AO_VIVO_2026-10-29.md`.
- **Fase 1 (Núcleo Puro):**
  - Módulos em `src/core/spectate/`: `signal-status.ts`, `rhythm-status.ts` (Opção B adaptativa por ritmo do jogo), `correction-diff.ts`, `spectator-projection.ts`.
- **Fase 2 (Banco de Dados e Prisma):**
  - Modelos `MatchShareLink` e `MatchSpectator` criados, migration `20261029090000_add_match_spectating`.
- **Fase 3 (Serviços e APIs):**
  - `/api/matches/[id]/share-links`, `/api/spectate/redeem`, `/api/spectate/[matchId]/feed`.
- **Fase 4 (Heartbeat do Anotador):**
  - `useAnnotatorHeartbeat.ts` com intervalo de 20s e silêncio em background.
- **Fase 5 (UI e Modais Conforme Anexos de Design):**
  - Modal de compartilhamento decomposta em conformidade estrita com a regra R-03:
    - `ShareSpectateModal.tsx` (orquestrador principal com hook `useShareSpectateModal.ts`).
    - `ShareSpectateCreateSection.tsx` (contexto da partida, label "Rótulo do convite", card de 3 regras com ícones e botão "Criar convite").
    - `ShareSpectateCreatedSection.tsx` (URL mono encurtada, botões Copiar link e WhatsApp, aviso de cópia única).
    - `ShareSpectateWatchersList.tsx` (cabeçalho "Acompanhando · X de 5", avatares circulares com iniciais, badge "Online", remoção individual e botão "Revogar convite").
    - `share-spectate.icons.tsx` (ícones SVG acessíveis e compatíveis com design system Telemetry).
  - Submódulos do lado do convidado alinhados rigorosamente ao wireframe do anexo:
    - `/matches/convite/[token]/page.tsx` e `InviteCard.tsx`: Tela de pré-visualização e resgate com botão explícito "Acompanhar partida", ação "Agora não", avatar com ícone de olho, subtítulo "X convidou você" e card com nomes abreviados de menores (`Ana S. × Bia L.`), quadra, set atual e badge "Ao vivo".
    - `GET /api/spectate/invite/[token]` e `spectator-preview.service.ts`: Endpoint de leitura segura de convite sem consumir a concessão antes do clique.
    - `/matches/acompanhar/[matchId]/`:
      - `SpectatorHeader.tsx`: Seta de voltar, título compacto, badge verde "Ao vivo" (ou "Aguardando início", "Pausada", "Encerrada", "Sem sinal") e subtítulo dinâmico "Atualizado há X s".
      - `SpectatorScoreboard.tsx`: Tabela em grid com cabeçalho de colunas `S1 S2 Pts`, pontuação dos sets e game atual.
      - `SpectatorLastPointBanner.tsx`: Faixa azul accent de linha única com último ponto.
      - `SpectatorTabs.tsx`: 3 abas (`Pontos`, `Resumo`, `Estatísticas`).
      - `SpectatorTimeline.tsx`: Linhas compactas `G4 · 40–30  Ana S. · ace`.
      - `SpectatorScoreAnnouncer.tsx`: Acessibilidade auditiva com `aria-live="polite"` que **só anuncia mudanças de game ou set**, preservando leitores de tela durante polling.
  - **Fase 6 (Implementação Integral dos 10 Estados de Erro, Feed, Conexão e Acesso):**
    - Alinhamento rigoroso aos 10 estados do wireframe:
      1. *NO_SIGNAL:* Banner de advertência `Sem atualização há X s. O placar pode estar atrasado.` (limite de 30s de heartbeat).
      2. *PAUSED:* Mapeado quando `MatchAnnotationSession` estiver suspensa/inativa sem que a partida tenha sido finalizada. Banner neutro `Pausada pelo anotador. Volta quando retomar.`.
      3. *NOT_STARTED:* Mapeado quando a partida foi criada mas tem 0 pontos (`totalPoints === 0`). Empty state com ampulheta `A partida ainda não começou. Os pontos aparecem aqui assim que o anotador registrar o primeiro.`.
      4. *FINISHED:* Scoreboard com placar final, aviso `Encerrada. Você acompanha até 7 dias após o término.` e acesso às estatísticas.
      5. *OFFLINE:* Detectado pelo cliente quando sem rede/internet. Banner `Você está sem internet. Mostrando dados de HH:MM.` e placar preservado com opacidade atenuada (`opacity: 0.6`).
      6. *403 ACCESS_REVOKED:* Erro imediato quando a concessão é removida pelo dono. Card com ícone de cadeado `Seu acesso foi encerrado. O dono da partida removeu seu acesso. Peça um novo convite.` e botão `Voltar ao início`.
      7. *404 INVITE_INVALID:* Card com link quebrado `Convite inválido ou expirado. Confira o link ou peça um novo ao dono da partida.` e botão `Voltar ao início`.
      8. *409 SPECTATOR_LIMIT:* Card com ícone de grupo `Esta partida está lotada. Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga.` e botão `Tentar de novo`.
      9. *EMPTY (Dono):* Modal com 0 acompanhantes exibe `Acompanhando · 0 de 5`, card com ícone de adicionar pessoa `Ninguém acompanha ainda. Envie o link para quem quiser ver a partida.` e botão `Copiar link`.
      10. *500 / rede (Dono):* Falha ao gerar convite exibe banner de erro `Não foi possível criar o convite. Tente de novo.`, retém o rótulo digitado e botão de retry `Tentar de novo`.
    - Componentes criados e testados:
      - `src/components/spectate/SpectatorEmptyState.tsx` (≤ 100L)
      - `src/components/spectate/SpectatorStatusBanner.tsx` (≤ 100L)
      - `src/components/scoring/ShareSpectateWatcherRow.tsx` (≤ 100L)
      - Suíte de testes: `src/components/spectate/__tests__/spectator-states.test.tsx` (100% verde).
  - Testes: 13 suítes, 51 testes do ecossistema de spectate 100% verdes. R-03: 1039 arquivos de produção, 0 violações, 0 regressões. Typecheck: 0 erros. Design tests: 100% verdes.

---

## 2.6 Execução Unificada — Conclusão Integral (Etapa 0, Onda 1, Onda 2, Onda 3 e Onda 4) — 2026-10-29
- **Origem:** Execução e auditoria do plano mestre unificado `docs/PLANO_EXECUCAO_UNIFICADA.md`.
- **Etapa 0 (Endurecimento e Baseline Verde):**
  - Gerado `docs/BASELINE-2026-10-29.md` com 397 suítes, 3904 testes (100% verde), 0 skipped, 0 typecheck errors, 0 lint warnings, 0 violações R-03.
  - Backup Neon criado: branch `backup-pre-onda1` (`br-patient-queen-ac275d7i`) a partir de `production` (`br-weathered-bird-ac5auqof`).
  - Golden snapshots em `docs/golden/` validados.
- **Onda 1 (Contas, Perfis, Roteamento, Autorização e Chrome Compartilhado):**
  - **1.1 Segurança Crítica de Partidas:** Validadas rotas de autorização (`GET /api/matches/[id]`, `/state`, `/point`, `/finish`) operando sob `canReadMatch`/`canAnnotateMatch` com checagem estrita de `athletePlayerId` e autorização falha fechada (*fail-closed*).
  - **1.2 Roteamento Canônico e Middleware:**
    - `src/middleware.ts` e `src/middleware-auth.logic.ts`: removido código morto; usuários autenticados em `/login` são interceptados e redirecionados para seu `homeForProfile` canônico (`ADMIN -> /admin`, `SUPORTE -> /suporte`, `GESTOR -> /gestor`, `TREINADOR/ATLETA -> /dashboard`, `mcp: true -> /trocar-senha`).
    - Eliminada duplicação de `getAuthToken` em `middleware-auth.logic.ts`.
    - `POST /api/auth/login` atualizado para retornar `mustChangePassword` na raiz do payload JSON além do objeto de usuário.
  - **1.3 Layout Compartilhado e Navegação:**
    - `DashboardChrome` promovido a layout compartilhado unificado com topbar responsiva, hamburger e sidebar integrados em `/dashboard`, `/gestor`, `/suporte` e `/admin`.
    - Itens de rotas em desenvolvimento (`/atleta/*`, `/treinador/*`) mantidos com `badge: 'Em breve'` e `disabled: true`, respeitando estritamente a segregação de Treinador e Atleta.
    - Botões "Voltar" migrados para navegação por perfil via `homeForProfileString` ou histórico seguro `router.back()`.
  - **1.4 Design System Telemetry:**
    - Eliminadas 100% das classes legadas arbitrárias (`bg-gray-*`, `text-gray-*`, `bg-sky-*`, `bg-white`) em `/gestor`, `/suporte` e `/admin` (`stats-card.tsx`, `status-pages.tsx`, `avulsos-section.tsx`, `module-nav.tsx`, `editar-clube-modal.tsx`, `editar-gestor-modal.tsx`).
    - Módulos aderentes ao Level 3 do Design System Stitch (`telemetry-bg`, `telemetry-card`, `telemetry-blue`, `telemetry-text-primary`, `telemetry-border/20`).
- **Onda 2 (Painéis Gestor `/gestor` e Suporte `/suporte`):**
  - Isolamento rigoroso de tenant com `withAccessHandler` nas APIs (`/api/users`, `/api/cts/[id]/athletes`, `/api/invites/accept`, `/api/training-centers`).
  - Modelos e validações completas de PJ/CPF (`cnpj.validator.ts`, `cpf.validator.ts`, `TrainingCenter.status` com `PENDING`/`ACTIVE`/`SUSPENDED`).
  - Onboarding multi-etapas no `/signup` com transação atômica em `POST /api/auth/signup-gestor`.
  - Painéis operacionais do Gestor (cadastro de membros com senhas provisórias de 7 dias, links de primeiro acesso, partidas do clube) e Suporte (aprovação/suspensão de CTs, revogação de sessões ativas).
- **Onda 3 (Funcionalidade Core — Nova Partida, Duplicidade, Dashboard e Estatísticas):**
  - Nova partida com labels "Simples"/"Duplas", campo Data opcional sem aviso redundante e auto-preenchimento ao iniciar anotação.
  - Algoritmo de duplicidade imune a colisões de duplas vs simples.
  - Formatação e abreviação compacta de nomes de duplas (`abbreviateDoublesName`).
  - Scoreboard e MatchCard com renderização de sobrescrito padronizada de tiebreak.
  - Estatísticas Avançadas (D3 Fundo de Quadra, D4 Rally, D6 Golpes, D7 Momentum, D8 Breakdown por Set) 100% implementadas e cobertas por testes.
- **Onda 4 (UX, Qualidade e Limpeza Geral):**
  - Backend padronizado com mensagens legíveis de erro via `formatZodMessage`.
  - Frontend resiliente com `extractErrorMessage` e substituição de 100% dos `window.alert()` por toasts.
  - Saneamento completo de `console.*` de produção para o wrapper de telemetria `logger.*`.
  - Pausa inteligente no polling de 5s do painel de anotação com `document.visibilityState === 'hidden'`.
- **Métricas Finais Consolidadas:**
  - `pnpm test:strict`: **397 suítes passadas, 3910 testes passados (100% verde), 2 snapshots passados** (0 falhas, 0 skips).
  - `pnpm test:design`: **3/3 suítes passadas, 26/26 testes verdes**.
  - `pnpm spec:validate`: **82 rotas, 10 schemas, sem drift, consistência total**.
  - `check:r03`: **993 arquivos de produção, 0 violações, 0 regressões**.
  - `typecheck`: **0 erros de compilação**.
  - `lint`: **0 erros, 0 avisos**.

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
  - `src/app/match/new/useNewMatchState.ts` — estados `slotAffiliation`, `ctId`, `availableCts`; `initialSlotAffiliation()` com defaults `NOT_OWN`; `updateSlotAffiliation`.
  - `src/app/match/new/components/my-club-selector.tsx` — select de CT para definir "meu clube".
  - `src/app/match/new/components/slot-affiliation-toggle.tsx` — toggle por slot "Meu clube" / "Outro clube".
  - `src/app/match/new/slot-affiliation.ts` — `SlotId`, `SlotAffiliation` ('OWN' | 'NOT_OWN'), `SlotAffiliationMap`, `isOwnSlot`, `filterAthletesForSlot`.
  - `src/app/match/new/components/PlayerSelection.tsx` — filtro de atletas **por slot** via `filterAthletesForSlot`; cada slot tem afiliação própria.
  - `src/app/match/new/components/AthleteDropdown.tsx` — prop `affiliation` + `onAffiliationChange` + `canSelectOwn`; renderiza `SlotAffiliationToggle` por slot.
  - `src/app/match/new/components/athlete-dropdown-panel.tsx` — exibe `a.club` abaixo do nome do atleta.
  - `src/app/match/new/MatchNewModals.tsx` — `modalMyClub` derivado de `newAthleteFor` + `isOwnSlot(slotAffiliation[slot], ctId)`.
  - `src/app/match/new/components/NewAthleteModal.tsx` + `use-new-athlete-modal.ts` — envia `myClub`/`ctId` ao criar atleta apenas quando `myClub && ctId`.
  - `src/app/api/players/players-post.logic.ts` — `shouldLink = Boolean(myClub)` (removeu `|| (isClubStaff && cts.length > 0)`); staff não vincula automaticamente.
  - `src/app/api/matches/match-ct-access.logic.ts` — `assertCtMembership` aceita ATLETA vinculado ao CT.
- **Fase 8 (Suporte e Resolução de Conflitos):** ✅
  - `src/services/player-merge.logic.ts` — `mergePlayers` com transferência de partidas, PlayerCTs, `mergedIntoId` e auditLog.
  - `src/app/api/players/merge/route.ts` — `POST /api/players/merge` com permissão `platform:player:merge`.
  - `src/app/api/athlete-claims/me/route.ts` — `GET /api/athlete-claims/me`.
- **Fase 9 (Testes Rigorosos):** ✅ — `typecheck` 0 erros · `check:r03` 0 regressões · `lint` 0 erros (apenas warnings jsx-a11y pré-existentes).
- **Fase 10 (Documentação):** ✅ — ADR-0010/ADR-0011 em `docs/ARCHITECTURE.md`; contratos em `src/app/api/CONTRACTS.md`; PRD, glossario, TASKS e MEMORY atualizados.
- **Opção A — Afiliacao por slot/atleta (nova partida):** ✅ — implementado em `src/app/match/new/`. Cada slot (P1, P2, P1Partner, P2Partner) tem sua propria escolha de clube ("Meu clube" / "Outro clube") via `SlotAffiliationToggle`. Heuristica de padrao: nenhum slot forcado a OWN; o anotador escolhe por slot (P1 pode ser OWN ou NOT_OWN; qualquer um dos 4 em duplas). Backend: `shouldLink = Boolean(myClub)` respeita a intencao da UI (sem vinculo automatico para staff). Dropdown exibe o clube ao lado do nome. Default: todos `NOT_OWN` (sem vinculacao presume adversario/avulso). Ao selecionar "Outro clube" com ctId definido, o filtro exclui atletas do meu clube (lista apenas atletas de outros clubes, com nome e clube visiveis); novo atleta eh criado sem vinculo algum.

## 2.3 Cadastro de Atleta de Outro Clube (UF, Cidade e Clube) — 2026-11-01

Plano `docs/PLANO_CADASTRO_ATLETA_OUTRO_CLUBE_UF_CIDADE_2026-11-01.md` executado:

- **Fase 1 (Módulo Central de UFs e Validações):** ✅
  - `src/core/athlete/brazilian-states.ts` — `BRAZILIAN_UFS` (27 UFs), `BrazilianUF` type, `isBrazilianUF` validator.
  - `src/schemas/player.ts` — `CreatePlayerInputSchema` e `UpdatePlayerInputSchema` com `club`, `city`, `state` (enum UF), `isExternalClub`.
  - `src/core/athlete/__tests__/brazilian-states.test.ts` — 4 testes (contagem, lista completa, valido/invalido).
- **Fase 2 (Componente Reutilizável de Origem):** ✅
  - `src/components/athlete/AthleteOriginSection.tsx` (88 linhas, respeita R-03) — grid 3 colunas: UF (select), Cidade (input), Clube do Atleta (input). Tokens Telemetry (`bg-telemetry-elevated`, `border-white/10`, `text-telemetry-text-primary`). Dual-theme.
  - `src/components/athlete/__tests__/AthleteOriginSection.test.tsx` — 6 testes (renderizacao, emissao de valores, UF invalida, valores iniciais).
- **Fase 3 (Integracao no Modal "Novo Atleta"):** ✅
  - `src/app/atletas/types.ts` — `AthleteForm` e `EMPTY_ATHLETE_FORM` com `uf`, `city`, `club`.
  - `src/app/match/new/components/use-new-athlete-modal.ts` — quando `myClub && ctId`, busca dados do clube via `GET /api/gestor/club` e preenche automaticamente `uf`, `city`, `club` no formulário; envia `myClub: true` + `ctId` no payload. Quando não é "Meu clube", envia `myClub: false`.
  - `src/app/match/new/components/NewAthleteModalForm.tsx` — integra `AthleteOriginSection` na secao "1. Cadastro"; passa `readOnly={myClub}` para travar os campos de origem quando eh atleta do proprio clube.
  - `src/app/components/athlete/AthleteOriginSection.tsx` — agora reage a mudancas nas props `uf`/`city`/`club` (useEffect de sincronizacao) e aceita prop `readOnly` para desabilitar os campos.
  - `src/app/atletas/edit-athlete-modal.submission.ts` + `edit-athlete-modal.types.ts` — `club`, `city`, `state`, `isExternalClub` no payload de salvamento.
- **Fases 4-6 (Treinador Avulso / Clube / Gestor):** ✅ — cobertas pelo componente reutilizavel `AthleteOriginSection` integrado ao modal compartilhado de cadastro de atleta. Backend `players-post.logic.ts` ja trata `myClub: false` sem gerar `PlayerCT`. Quando `myClub=true`, os campos de origem vem preenchidos com os dados do proprio clube (somente leitura).
- **Fase 7 (Exibicao da Origem em Cards):** ✅ — cards do dashboard exibem badge "Meu clube" / "Outro clube" / "Sem clube" ao lado do nome de cada atleta (comparando `club` com `ctId` do usuario logado).
- **Indicacao de clube nos cards de partida (dashboard):** ✅ — os cards de partida no dashboard (`src/components/dashboard/`) exibem se cada atleta eh "Meu clube" ou "Outro clube" ao lado do nome.

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
- **Fase 4 (Aba "Externos" no Suporte):** ✅
  - Nova aba `externos` no `/suporte` listando atletas e clubes sem conta no sistema (cadastrados como adversários em partidas).
  - `src/app/api/suporte/externos/route.ts` — endpoint `GET /api/suporte/externos` que busca `Player` sem `userId` com `club`, `city`, `state`, `gender`, `age`; agrega clubes distintos com localização.
  - `prisma/schema.prisma` — model `Player` ganhou campos `city` e `state`.
  - `src/app/suporte/types.ts` — `SuporteModule` inclui `'externos'`; `SuporteData` inclui `externos: ExternosData | null`; novos tipos `ExternalAthlete`, `ExternalClub`, `ExternosData`.
  - `src/app/suporte/externos-section.tsx` — seção com duas subseções: Atletas Sem Conta (tabela com nome, clube, cidade, estado, gênero, idade) e Clubes Mencionados (tabela com clube, cidade, estado, qtd atletas).
  - `src/app/suporte/suporte-header.tsx` — novo contador "Atletas Externos".
  - `src/app/suporte/suporte-tab-nav.tsx` + `module-nav.tsx` — nova aba "Externos".
  - `src/app/suporte/page.tsx` — busca `GET /api/suporte/externos` no carregamento inicial.
  - `src/app/suporte/suporte-page-content.tsx` — renderiza `ExternosSection` quando `module === 'externos'`.
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
| 2026-10-29 | `main` | **Acompanhamento de Partidas ao Vivo (Transmissão de Partidas)**: implementação completa com núcleo puro em `src/core/spectate/` (`types`, `signal-status`, `rhythm-status`, `correction-diff`, `spectator-projection`), migração Prisma aditiva `20261029090000_add_match_spectating` (`MatchShareLink`, `MatchSpectator`, `PointLog.receivedAt`, `PointLog.updatedAt`, `MatchAnnotationSession.lastHeartbeatAt`, `ConsentPurpose.BROADCAST`), serviços de convite e pré-checagem barata Passo 0 no Postgres (<150 bytes, proteção contra estouro de egress do Neon), APIs REST em `/api/spectate/*`, hook de presença `useAnnotatorHeartbeat` (20s com pausa em background e throttle de 15s), suporte seguro a `next` no login e middleware, tela de acompanhamento `/matches/acompanhar/[matchId]` com Scoreboard adaptado, faixa de último ponto com ritmo de jogo simplificado (Opção B), abas Pontos/Resumo e modal `ShareSpectateModal`. 100% STE-DEV R-03 (0 violações em 1026 arquivos), 32 testes de domínio/serviço novos e 100% da suíte de design e componentes passando. |
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
