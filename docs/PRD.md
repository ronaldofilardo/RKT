# PRD — RKT (Racket App)

> Documento gerado por engenharia reversa (metodologia RE-DOC) sobre o código-fonte do repositório.
> **Este é um dos 6 arquivos-canônico do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.
> **Data da análise:** 2026-10-01 · **Commit de referência:** `c53ae98` (main)
> Este documento descreve **apenas** o que o código atual entrega ou estruturou. Nenhuma funcionalidade foi inventada.

---

## 1. Visão Geral

**RKT** é uma aplicação web (Next.js App Router) de **anotação tática ao vivo de partidas de tênis**. O sistema permite que um usuário com papel de **anotador (ANNOTATOR)** crie partidas, registre ponto a ponto com estatísticas (ace, erro não forçado, dupla falta etc.), acompanhe o placar em tempo real, corrija o placar quando necessário e gere relatórios analíticos. O papel **ADMIN** gerencia os usuários do sistema.

O coração do produto é o **Scoring Engine** (`src/core/scoring/engine.ts`): um motor puro, agnóstico de UI e de backend, que processa cada ponto e calcula o estado de game/set/match segundo 7 formatos de jogo oficiais.

---

## 2. Declaração do Problema

- A anotação de partidas de tênis é feita em tempo real, sob pressão de tempo, e erros de contagem (tiebreak, match tiebreak, sets sem ad-avantage) são comuns quando feitos manualmente.
- Partidas longas e interrompidas perdem contexto: quem anotou parou no set 2 e outro retoma no set 3 — o placar precisa ser corrigido sem perder a timeline anterior.
- Não há um registro estruturado e auditável de cada ponto (quem anotou, quando, com que anotação de áudio/texto) nem de quem anotou qual trecho.
- O anotador pode ficar sem conexão (quadra/campo sem rede) e precisa continuar anotando.

---

## 3. Usuários-Alvo

O sistema tem **exatamente 2 papéis** (`enum Role` em `prisma/schema.prisma:205`):

| Papel | Origem | Capacidades observadas no código |
|---|---|---|
| **ANNOTATOR** (padrão) | `User.role @default(ANNOTATOR)` | Criar/gerenciar partidas, anotar pontos, comentários, áudio, sessões de anotação, editar placar, ver relatórios |
| **ADMIN** | `middleware.ts` bloqueia `/admin` para não-ADMIN | CRUD de usuários em `/admin` (`/api/admin/users`), além de tudo do ANNOTATOR |

---

## 4. Objetivos do Produto

| # | Objetivo | Evidência no código |
|---|---|---|
| O1 | Registrar cada ponto de uma partida com contexto estatístico | `POST /api/matches/:id/point`, enum `PointType` (7 tipos) |
| O2 | Manter o placar consistente em 7 formatos de jogo | `MatchFormat` (BEST_OF_3, BEST_OF_5, NO_AD, PRO_SET_8, MATCH_TB_10…) + `src/core/scoring/` |
| O3 | Permitir correção de placar sem perder a timeline | model `MatchScoreEdit` com snapshots `previousScoreState`/`newScoreState` |
| O4 | Suportar sessões de anotação com retomada/abandono/respaldo | models `MatchAnnotationSession`, `AnnotationEndorsement` |
| O5 | Funcionar offline e sincronizar depois | `src/lib/offlineDb.ts` (IndexedDB), `src/lib/offlineStorageSync.ts`, testes `e2e/flows/03-offline-sync.spec.ts` |
| O6 | Gerar relatório analítico da partida | `GET /api/matches/:id/report`, página `/match/[id]/report`, `src/core/report/` |
| O7 | Isolar usuários e proteger a API | JWT (`jose`) + middleware + `withRLSHandler` (22 de 25 rotas) + headers de segurança |
| O8 | Garantir acessibilidade e identidade visual consistente | ESLint `jsx-a11y`, testes `expectNoAxeViolations`, Telemetry Design System + `pnpm test:design` |

---

## 5. Escopo do MVP (extraído das rotas)

### 5.1 Telas visíveis ao usuário (14 `page.tsx`)

| Rota | Arquivo | Função |
|---|---|---|
| `/` | `src/app/page.tsx` | Home estática; **middleware redireciona para `/login`** |
| `/login` | `src/app/login/page.tsx` | Autenticação (JWT em cookie `rkt_access_token`) |
| `/dashboard` | `src/app/dashboard/page.tsx` | Hub principal: partidas finalizadas, ao vivo, pendentes |
| `/historico` | `src/app/historico/page.tsx` | Re-renderiza `DashboardPage` (view `history`) |
| `/partidasanotadas` | `src/app/partidasanotadas/page.tsx` | Re-renderiza `DashboardPage` (view `annotated`) |
| `/partidasaovivo` | `src/app/partidasaovivo/page.tsx` | Re-renderiza `DashboardPage` (view `live`) |
| `/dados-pessoais` | `src/app/dados-pessoais/page.tsx` | Re-renderiza `DashboardPage` |
| `/atletas` | `src/app/atletas/page.tsx` | Cadastro/edição/busca de atletas e rankings |
| `/match/new` | `src/app/match/new/page.tsx` | Criação de partida (formato, atletas, torneio, saque inicial) |
| `/match/[id]/scoring` | `src/app/match/[id]/scoring/page.tsx` | **Tela de anotação ao vivo** (placar, timeline, modais) |
| `/match/[id]/report` | `src/app/match/[id]/report/page.tsx` | Relatório/estatísticas da partida |
| `/matches/locate` | `src/app/matches/locate/page.tsx` | Localizar partidas (rota pública) |
| `/aguardandoanotador` | `src/app/aguardandoanotador/page.tsx` | Aguarda anotador assumir; faz polling de `/api/matches/:id` |
| `/admin` | `src/app/admin/page.tsx` | Gestão de usuários e papéis (somente ADMIN) |

**Fluxo de autenticação:** `/` → redirect middleware → `/login` → `POST /api/auth/login` → cookies `rkt_access_token` + `access_token` → acesso a rotas privadas. Rotas públicas: `/login`, `/matches/locate`, `/api/auth/login`, `/api/auth/logout` (`src/middleware.ts:5-10`).

### 5.2 APIs (25 `route.ts`)

| Área | Endpoints (métodos) |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` |
| Admin | `GET,POST /api/admin/users`; `PATCH,DELETE /api/admin/users/[id]` |
| Players | `GET,POST /api/players`; `GET,PUT,DELETE /api/players/[id]` |
| Matches | `GET,POST /api/matches`; `GET,PUT,DELETE /api/matches/[id]` |
| Pontos | `POST /api/matches/[id]/point`; `DELETE,PATCH /api/matches/[id]/point/[pointId]`; `GET,POST,DELETE .../point/[pointId]/audio` |
| Estado/Fim | `PATCH /api/matches/[id]/state`; `POST /api/matches/[id]/finish`; `GET /api/matches/[id]/events` (SSE `text/event-stream`) |
| Timeline/Meta | `GET /api/matches/[id]/point-logs-meta`; `GET /api/matches/[id]/report` |
| Comentários | `POST,GET /api/matches/[id]/comments`; `PATCH,DELETE .../comments/[commentId]`; `POST,GET,DELETE .../comments/[commentId]/audio` |
| Sessões | `GET,POST /api/matches/[id]/sessions`; `PATCH .../sessions/[sessionId]`; `POST .../abandon`; `POST .../endorse` |
| Dashboard | `GET /api/matches/suspended-sessions`; `GET /api/matches/tournament-suggestions` |

### 5.3 Modelo de dados (8 models + 6 enums)

`User` · `Player` · `Match` · `PointLog` · `MatchScoreEdit` · `MatchComment` · `MatchAnnotationSession` · `AnnotationEndorsement`
Enums: `Role`, `MatchState`, `MatchFinishReason`, `MatchFormat`, `PointType`, `AnnotationSessionStatus`.

---

## 6. Principais Funcionalidades (MVP)

1. **Autenticação JWT + RBAC** — login/logout, cookie de acesso, bloqueio de `/admin` por papel.
2. **Gestão de atletas** — CRUD de `Player` com ranking estruturado (`rankings Json`), busca e tabela.
3. **Criação de partida** — formato, jogadores, torneio/rodada/chave, condição de quadra/clima, saque inicial, sugestões de torneio.
4. **Anotação ao vivo (scoring)** — aplicação de ponto, placar ao vivo, timeline, undo/redo, edição de placar, validações de formato.
5. **Comentários e áudio** — comentário por partida e por ponto, com nota de áudio (`audioNote Bytes` + mime + duração).
6. **Sessões de anotação** — iniciar, suspender/retomar, abandonar, respaldar (`endorse`) por outro usuário.
7. **Relatório** — estatísticas por set, momentum, pressão, saque/recepção (`src/core/report/`) + exportação.
8. **Offline-first** — fila IndexedDB de criação de partida e sincronização com resolução de conflito.
9. **Tempo real** — SSE em `/api/matches/[id]/events` com buffer de eventos (`src/lib/match-events.ts`).
10. **Administração** — listagem/edição de usuários e mudança de papel.

---

## 7. Riscos/Dependências de Negócio Identificados no Código

- **Segurança do segredo JWT:** `.env.example` pede `JWT_SECRET`; a centralização do segredo foi dívida crítica (TD-008/TD-060, `TASKS.md` Anexo A) — `src/lib/jwt.ts` nunca foi entregue.
- **Isolamento RLS:** `withRLSHandler` cobre 22 das 25 rotas (`/api/auth/login`, `/api/auth/logout` e `/api/matches/tournament-suggestions` ficam fora); `TD-003` aponta suspeitas de propagação incompleta de contexto.
