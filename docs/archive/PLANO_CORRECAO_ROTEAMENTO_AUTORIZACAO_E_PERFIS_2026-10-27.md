# PLANO DE CORREÇÃO — Roteamento por Perfil, Autorização de Partidas e Inconsistências de Ecossistema

**Data:** 2026-10-27  
**Origem:** Auditoria de conformidade estática e dinâmica da arquitetura multiperfil e ecossistema de partidas.  
**Referências:** AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md (ADR-0008 a ADR-0011), docs/RULES.md, docs/DESIGN.md, docs/TASKS.md, docs/MEMORY.md.

---

## 1. Visão Geral e Objetivo

Este plano consolida as ações corretivas prioritárias para sanar as inconsistências estruturais identificadas no ecossistema RKT, garantindo que:
1. A autorização de partidas opere com integridade, comparando identificadores corretos e sob o princípio de **falha fechada**;
2. Cada perfil autenticado (ADMIN, SUPORTE, GESTOR, TREINADOR, ATLETA) seja direcionado à sua tela de início (*home*) apropriada, sem desviar indevidamente para a interface do anotador;
3. As barreiras de layout sejam unificadas (sidebar presente em todas as seções administrativas);
4. O design system baseado em tokens `telemetry-*` cubra integralmente as páginas de suporte, gestor e admin.

---

## 2. Diagnóstico das Causas Raiz

### 2.1. Causa Raiz: Perfis caindo nas telas de anotador
1. **O login só distingue ADMIN, SUPORTE, GESTOR e TREINADOR:** `computeLoginProfile` não contempla `ATLETA`, e `use-login-form.ts` direciona TREINADOR e ATLETA indistintamente para `/dashboard`.
2. **Redirecionamento por perfil no middleware é código morto:** `/login` pertence a `PUBLIC_ROUTES`, retornando antes de `handleAuthenticated`. O ramo `SUPORTE → /suporte` é inalcançável porque a condição anterior direciona SUPORTE para `/admin`.
3. **Ausência de guard nas telas de operação:** O middleware restringe apenas `/admin`, `/suporte` e `/gestor`. Suporte e Gestor conseguem acessar rotas de operação sem restrição.
4. **Fallback do menu concede `canOperate: true`:** `getDefaultMenuContext` define `canOperate: true` de forma fixa enquanto `/api/auth/me` ainda não respondeu, exibindo opções de anotação até para usuários SUPORTE puros.
5. **Falta de sidebar em `/gestor`, `/suporte` e `/admin`:** O componente `DashboardChrome` só é instanciado em `/dashboard`.
6. **Links com query params (`?tab=`, `?module=`) não reativos:** A seleção ocorre apenas na montagem da tela, sem sincronização com o histórico do navegador.
7. **Botão "Voltar" envia sempre para `/dashboard`:** Ausência do conceito de `homeFor(perfil)` unificada.
8. **Classes de estilo fora do Design System:** Presença maciça de classes Tailwind arbitrárias (`bg-gray-*`, `bg-sky-*`, etc.) em vez de tokens `telemetry-*`.

### 2.2. Inconsistências Críticas de Autorização e APIs
1. **Comparação errônea de `Player.id` com `User.id`:**
   - Em `GET /api/matches/[id]`, `checkCanModifyMatchState` e `validateMatchAnnotatorPermission`, ocorre a verificação: `match.player1Id === currentUserId || match.player2Id === currentUserId`.
   - `player1Id` é CUID da tabela `Player`; `currentUserId` é CUID da tabela `User`. A condição nunca se satisfaz, impedindo o atleta de ser reconhecido como participante da sua própria partida.
2. **Autorização Falha Aberta:**
   - Se o model `matchAnnotationSession` não estiver disponível, `checkCanModifyMatchState` retorna `true`, violando o princípio do menor privilégio.
3. **Rota 404 em `club-matches-table.tsx`:**
   - Link aponta para `/match/${id}`, mas apenas `/match/[id]/report` e `/match/[id]/scoring` existem.
4. **Duas camadas de autorização desconectadas:**
   - O relatório utiliza `canReadMatch` (staff do CT, seguidos, responsáveis); o restante das rotas (`point`, `state`, `finish`) utiliza checagens legadas.

### 2.3. Inconsistências Importantes e Código Morto
- `openForAnnotation === true` permite manipulação sem controle estrito de sessão.
- `GET /api/matches/[id]/sessions` não valida o acesso prévio à partida.
- `login` não devolve `mustChangePassword` no payload JSON.
- `visibility.ts:33` compara `ids.includes(actor.userId)` com IDs de `Player`.
- `useAccess` não possui consumidores no código de produção.
- `cookie` `user_role` sem utilização no servidor.

---

## 3. Roteiro de Execução em 4 Etapas

### Etapa 1 — Segurança Crítica e Autorização de Partidas (Urgência Alta)
1. **Unificação da Identidade do Atleta na Partida:**
   - Comparar `player1Id` e `player2Id` com `actor.athletePlayerId` (resolvido a partir de `Player.userId`), e nunca diretamente com `User.id`.
   - Eliminar a comparação incorreta em `visibility.ts:33`.
2. **Autorização "Falha Fechada" (Fail-Closed):**
   - Garantir que se a sessão não for encontrada ou o modelo falhar, a autorização retorne estritamente `false`.
3. **Unificação em `canReadMatch` e `canAnnotateMatch`:**
   - Centralizar a autorização de `GET`, `state`, `point` e `finish` nas funções puras do núcleo de acesso.
4. **Correção do Link de Visualização no Gestor:**
   - Em `club-matches-table.tsx`, apontar para `/match/${m.id}/report` (ou `/match/${m.id}/scoring` se em andamento).

### Etapa 2 — Roteamento Canônico, Home por Perfil e Middleware
1. **Helper Puro `homeForProfile`:**
   - Implementar função pura `homeForProfile(actor)` em `src/core/access/home.ts`:
     - `ADMIN` → `/admin`
     - `SUPORTE` → `/suporte`
     - `GESTOR` → `/gestor`
     - `TREINADOR` → `/dashboard` (ou `/treinador` quando disponível)
     - `ATLETA` → `/dashboard` (ou `/atleta` quando disponível)
2. **Correção do Middleware:**
   - Remover código morto em `middleware-auth.logic.ts`.
   - Garantir que usuários autenticados que acessem `/login` sejam redirecionados para seu `homeForProfile`.
   - Garantir redirecionamento correto para `SUPORTE → /suporte`.
3. **Inclusão de `mustChangePassword` na resposta de Login:**
   - Devolver `mustChangePassword` no JSON retornado por `POST /api/auth/login`.

### Etapa 3 — Layout Compartilhado e Navegação por Perfil
1. **Layout Compartilhado com Sidebar:**
   - Promover `DashboardChrome` / `DashboardSidebar` para um layout compartilhado envolvente de `/dashboard`, `/gestor`, `/suporte` e `/admin`.
2. **Tratamento de Telas em Desenvolvimento:**
   - Marcar rotas `/atleta/*` e `/treinador/*` no menu com `badge: 'Em breve'` e `disabled: true` enquanto não possuírem páginas implementadas.
3. **Botões de Voltar:**
   - Fazer com que o botão voltar utilize `homeForProfile` ou histórico seguro em vez de assumir estaticamente `/dashboard`.

### Etapa 4 — Adequação ao Design System e Limpeza de Código Morto
1. **Migração para Tokens `telemetry-*`:**
   - Substituir `bg-gray-*`, `bg-sky-*`, `bg-white`, `text-gray-*` nas páginas `/gestor`, `/suporte` e `/admin` pelos equivalentes do tema (`telemetry-bg`, `telemetry-card`, `telemetry-primary`, `telemetry-text-primary`, etc.).
2. **Remoção de Código Morto:**
   - Descontinuar hook não utilizado `useAccess` e sincronizar arquivos redundantes.

---

## 4. Critérios de Aceite e Métricas de Qualidade

1. **Testes Estritos:** `pnpm test:strict` 100% verde sem nenhum teste pulado (`check-no-skipped-tests.mjs`).
2. **Regra R-03:** Todos os arquivos novos e modificados estritamente abaixo de 100 linhas de código.
3. **TypeScript:** `pnpm typecheck` executando com 0 erros.
4. **Nenhum 404 em Links Internos:** Nenhum botão ou link de tabela apontando para rota não roteada pelo Next.js.
5. **Auditoria:** Registro contínuo das etapas em `docs/TASKS.md` e `docs/MEMORY.md`.

