# PLANO DE CORREÇÃO DE MENUS, ROTAS E BLINDAGEM DE SESSÃO (RKT)
## Metodologia Elephant-Goldfish Model (Google EGM)

> **Data:** 2026-11-12  
> **Framework:** Elephant-Goldfish Model (EGM)  
> **Status:** **APROVADO APÓS AUDITORIA CRÍTICA (PASS)**  
> **Documentos Canônicos:** [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [RULES.md](./RULES.md), [DESIGN.md](./DESIGN.md), [TASKS.md](./TASKS.md), [MEMORY.md](./MEMORY.md).

---

## 🐘 PARTE 1 — THE ELEPHANT (Memória Longa & Contexto do Sistema)

### 1.1 Contexto & Diagnóstico dos Problemas
A auditoria identificou duas classes de problemas críticos na experiência do usuário:
1. **Desconexões / Logouts Acidentais:** Usuários são deslogados involuntariamente ao abrir nova aba, reabrir o PWA ou por oscilações temporárias de banco de dados.
2. **Rotas Incorretas, Menus Incompletos e Loops:** Itens de menu direcionam para páginas erradas que repelem o usuário imediatamente de volta à Home, menus de Treinador e Atleta carecem de links para Início e Histórico, e URLs de áreas sofrem duplicações.

### 1.2 Matriz de Sintomas e Causas-Raiz
| Categoria | Sintoma | Causa-Raiz | Arquivo Afetado |
|---|---|---|---|
| **Sessão** | Logout ao abrir nova aba ou reabrir PWA | `use-dashboard-matches-fetch` lê `sessionStorage.getItem('user_role')`. Como nova aba não tem `sessionStorage`, aciona `redirectToLogin()`. O cookie `rkt_access_token` é `HttpOnly` e válido, mas o middleware o deleta no servidor quando acessado `/login?exit=1`. | `src/app/dashboard/hooks/use-dashboard-matches-fetch.ts`, `src/lib/auth-client-storage.ts`, `src/middleware-auth.logic.ts` |
| **Sessão** | Logout por instabilidade temporária de rede/banco | `loadActor` engole erros de banco com `catch { return null }`, resultando em falso `401 Unauthorized`. O frontend recebe 401 e chama `redirectToLogin()`. | `src/services/accessService.ts`, `src/lib/access-handler.ts` |
| **Sessão** | Bouncing / repulsão para a Home | Telas como `/atletas` e `/admin` forçam `router.push('/login')` se `sessionStorage` estiver vazio. O middleware vê o cookie válido e faz redirect 307 de volta para a Home da área. | `src/app/atletas/hooks/useAtletasPage.ts`, `src/app/admin/use-admin-page.ts`, `src/middleware-auth.logic.ts` |
| **Menu / Rota** | "Aguardando" pisca e volta ao início | Item do menu aponta para `/aguardandoanotador`, que exige `?matchId=`. Sem o parâmetro, faz `router.replace` imediato para a Home. A subvisão de partidas aguardando no dashboard fica inacessível. | `src/app/aguardandoanotador/page.tsx`, `src/app/dashboard/dashboard-view.logic.ts` |
| **Menu / Rota** | Treinador sem Início e Histórico no menu | Menu do Treinador possui apenas Atletas, Relatórios, Partidas Públicas e Nova Partida. Faltam Início (`/dashboard`), Histórico (`/historico`), Partidas Anotadas (`/partidasanotadas`) e Ao Vivo (`/partidasaovivo`). | `src/core/access/menu-items.ts`, `src/core/access/menu.ts` |
| **Menu / Rota** | Atleta com menu incompleto | Menu do Atleta só tem Relatórios e 4 itens desabilitados ("Em breve"). Faltam Início, Minhas Partidas, Nova Partida e Públicas (que existem na Home). | `src/core/access/menu-items.ts`, `src/core/access/menu.ts` |
| **Menu / Rota** | Gestor com duplicação de rota (`/clube/gestor/gestor`) | `appPath` não reconhece `/gestor` como rota de área (o prefixo é `/clube/gestor`) e concatena `${prefix}${cleanPath}`, duplicando o caminho. | `src/core/access/app-path.logic.ts`, `src/core/access/areas.ts` |
| **UI / TopBar** | Seta "Voltar" indevida para Gestor e Suporte | TopBar avalia `user.role` (enum Prisma `'ANNOTATOR'`), logo a exclusão `isExcluded` falha. O botão voltar tenta navegar para `/dashboard` e sofre redirect. | `src/app/dashboard/components/DashboardTopBar.tsx` |
| **Performance** | Cliques no menu causam recarga total | `isDashboardRoute` testa `pathname === '/dashboard'`. Com URLs de área ativas (`/treinador`, etc.), a condição é falsa e força full-reload. | `src/app/dashboard/components/dashboard-menu.logic.ts` |

---

## 🐟 PARTE 2 — THE GOLDFISH (Auditoria de Premissas, Riscos e Resoluções)

A auditoria cega independente do Goldfish inspecionou o código real e levantou 6 pontos cegos críticos, devidamente resolvidos abaixo:

### 2.1 Premissas Implícitas Corrigidas
1. **Invisibilidade de Cookies `HttpOnly` no Cliente:**
   - *Ponto cego apontado:* O cookie `rkt_access_token` é `HttpOnly: true`. O JavaScript (`document.cookie`) não consegue lê-lo.
   - *Resolução adotada:* A hidratação de sessão **não deve** condicionar a verificação a `document.cookie`. O cliente chama assincronamente `GET /api/auth/me` (o browser envia o cookie automaticamente na requisição). Se responder 200, popula o `sessionStorage` com os dados do usuário. Se responder 401 real, redireciona suavemente.
2. **Destruição de Sessão no Middleware por `exit=1`:**
   - *Ponto cego apontado:* `src/middleware-auth.logic.ts:52-59` limpa todos os cookies no servidor sempre que a rota `/login` recebe o query parameter `exit=1`.
   - *Resolução adotada:* `redirectToLogin()` **NUNCA** deve incluir `exit=1` na URL. O parâmetro `exit=1` é restrito e exclusivo da função `performLogout()`, acionada quando o usuário clica expressamente em "Sair".
3. **Prevenção do Loop 307 (Bounce Loop):**
   - *Ponto cego apontado:* Usuário com cookie entra na Home; `sessionStorage` vazio faz redirect para `/login`; middleware vê cookie e faz 307 de volta para a Home; loop infinito.
   - *Resolução adotada:* Telas e hooks nunca disparam `redirectToLogin()` de forma síncrona/imediata. Aguardam o ciclo de hidratação de `src/lib/auth-session-hydration.logic.ts`.
4. **Tratamento de Falhas Transitórias de Banco (Falso 401):**
   - *Ponto cego apontado:* Lançar erro de banco direto em `loadActor` quebrava a assinatura de chamada em dezenas de rotas e causava unhandled rejection.
   - *Resolução adotada:* Criar helper dedicado `src/services/access-error.logic.ts`. Em `withAccessHandler`, erros de conexão de banco retornam status HTTP `503 Service Unavailable` com cabeçalho de retry, impedindo que o frontend receba falso `401`.
5. **Preservação de Testes e Rotas para "Aguardando":**
   - *Ponto cego apontado:* Alterar a rota do menu para `/dashboard?view=pending` quebrava `HamburgerMenu.test.tsx` e `useDashboardNavigation`, além de não ser suportado por `resolveDashboardView`.
   - *Resolução adotada:* Manter a rota do menu em `/aguardandoanotador`. Na página `src/app/aguardandoanotador/page.tsx`:
     - Se `matchId` ausente: renderiza `<DashboardPage />` (que nativamente ativa a subvisão `pending`, sem redirects).
     - Se `matchId` presente: renderiza a sala de espera do espectador.
     Zero breaking changes, zero impacto em testes existentes.
6. **Alinhamento do Menu de Suporte:**
   - *Ponto cego apontado:* Não existem rotas `/suporte/chamados` ou `/suporte/auditoria` (gerariam 404).
   - *Resolução adotada:* Menu de Suporte direciona para as abas reais da página `/suporte` (`/suporte?tab=clubes`, `/suporte?tab=gestores`, `/suporte?tab=avulsos`, `/suporte?tab=externos`).

### 2.2 Blindagem Contra Estouro de Linhas (Regra R-03: Max 100 Linhas)
| Arquivo Original | Linhas Atuais | Risco R-03 | Estratégia de Modularização Obrigatória |
|---|---|---|---|
| `src/services/accessService.ts` | **98L** | Altíssimo (restam 2L) | Criar `src/services/access-error.logic.ts` para isolar checagem de erros de infraestrutura do Prisma. |
| `use-dashboard-matches-fetch.ts` | **97L** | Altíssimo (restam 3L) | Criar `src/lib/auth-session-hydration.logic.ts` para encapsular a hidratação de sessão via `/api/auth/me`. |
| `DashboardTopBar.tsx` | **87L** | Alto (restam 13L) | Criar `src/app/dashboard/components/dashboard-topbar-profile.logic.ts` para resolver papéis e visibilidade do botão voltar. |
| `src/core/access/menu.ts` | **84L** | Médio | Fatiar seções por helper em `src/core/access/menu-sections.logic.ts`. |
| `src/core/access/menu-items.ts` | **82L** | Médio | Fatiar catálogo de itens em `src/core/access/menu-definitions.logic.ts`. |
| `src/lib/auth-client-storage.ts` | **87L** | Médio | Manter funções puras e concisas sem exceder 100 linhas. |

---

## 🎯 PARTE 3 — PLANO DE EXECUÇÃO CIRÚRGICA

### Fase 1: Blindagem de Sessão & Prevenção de Logouts Acidentais
- [x] **1.1 Desacoplar `redirectToLogin` de `clearAuthState` e remover `exit=1`:**
  - Em `src/lib/auth-client-storage.ts`, `redirectToLogin` redireciona para `/login` (ou `/login?next=...`) **sem `exit=1`** e sem apagar cookies.
  - A destruição de cookies via `clearAuthState()` e `POST /api/auth/logout` é exclusiva de `performLogout()`.
- [x] **1.2 Criar módulo puro de hidratação de sessão (`auth-session-hydration.logic.ts`):**
  - Implementar `hydrateSessionFromMe()`: consulta `GET /api/auth/me`. Se 200, preenche `sessionStorage` com `user_role`, `active_area`, `user_id`. Se 401, aciona `redirectToLogin()`.
  - Integrar com `use-dashboard-matches-fetch.ts` sem estourar o limite de 97 linhas (R-03).
- [x] **1.3 Tratamento de falhas transitórias de banco:**
  - Criar `src/services/access-error.logic.ts` para identificar falhas de infraestrutura do Prisma (`PrismaClientInitializationError`, connection timeouts).
  - Em `src/lib/access-handler.ts`, responder com HTTP 503 caso ocorra falha de infraestrutura, prevenindo falsos 401.
- [x] **1.4 Evitar loop de redirect em telas secundárias:**
  - Em `useAtletasPage.ts` e `use-admin-page.ts`, aguardar hidratação de sessão antes de qualquer navegação para `/login`.

### Fase 2: Correção de "Aguardando" & Navegação do Dashboard
- [x] **2.1 Normalizar sala de espera em `src/app/aguardandoanotador/page.tsx`:**
  - Se `!matchId`, renderizar `<DashboardPage />` diretamente, ativando a subvisão `pending` sem loops ou redirects.
  - Manter rota `/aguardandoanotador` compatível com `HamburgerMenu.test.tsx` e `useDashboardNavigation`.
- [x] **2.2 Suportar URLs de área em `isDashboardRoute`:**
  - Em `src/app/dashboard/components/dashboard-menu.logic.ts`, normalizar rota checando se o pathname pertence ao conjunto de homes de área (`/anotador`, `/treinador`, `/atleta`, `/dashboard`), evitando full-reload ao alternar abas no dashboard.

### Fase 3: Menus Completos por Perfil
- [x] **3.1 Menu de Treinador (`TREINADOR_CLUBE` e `TREINADOR_AVULSO`):**
  - Adicionar itens: *Início* (`/dashboard`), *Histórico / Minhas Partidas* (`/historico`), *Partidas Anotadas* (`/partidasanotadas`) e *Ao Vivo* (`/partidasaovivo`).
- [x] **3.2 Menu de Atleta (`ATLETA`):**
  - Adicionar itens: *Início* (`/dashboard`), *Minhas Partidas* (`/historico`), *Nova Partida* (`/match/new`) e *Partidas Públicas* (`/partidas-publicas`).
- [x] **3.3 Menu de Suporte:**
  - Adicionar atalhos para as abas reais da página de suporte (`/suporte?tab=clubes`, `/suporte?tab=gestores`, etc.).

### Fase 4: Normalização de URLs de Gestor & UI TopBar
- [x] **4.1 Resolução de caminhos em `appPath`:**
  - Tratar `/gestor` em `app-path.logic.ts` para resolver como `/clube/gestor` sem duplicar `/clube/gestor/gestor`.
- [x] **4.2 Visibilidade do botão Voltar no `DashboardTopBar.tsx`:**
  - Criar `dashboard-topbar-profile.logic.ts` para checar `activeArea` ou membership do usuário, ocultando a seta de voltar adequadamente para Gestores e Suporte.

### Fase 5: Verificação & Homologação
- [x] **5.1 R-03 Check:** Executar `pnpm check:r03` (ou `node scripts/audit-max-lines.js`) garantindo que nenhum arquivo exceda 100 linhas.
- [x] **5.2 TypeScript:** Executar `pnpm typecheck` com 0 erros.
- [x] **5.3 Testes Unitários de Menus e Rotas:**
  - Atualizar mocks em `src/core/access/__tests__/menu.test.ts` e `HamburgerMenu.test.tsx` em lockstep.
  - Rodar: `pnpm test`.
- [x] **5.4 Testes de Design:** Executar `pnpm test:design`.

---

## 🏆 VEREDITO DO GOLDFISH

**`PASS — APROVADO PARA EXECUÇÃO CIRÚRGICA`**  
Todas as premissas implícitas foram sanadas, os riscos de quebra de testes legados foram mitigados, as regras R-03 e R-04 foram blindadas através de fatiamento modular e a ordem de execução prioriza a estabilidade de sessão.
