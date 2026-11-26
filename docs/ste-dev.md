# STE-DEV — Rastreabilidade de Decisões (RKT)

Este documento registra decisões de arquitetura e exceções conscientes tomadas durante a aplicação da metodologia STE-DEV no projeto RKT.

## Exceções STE-DEV (ste-exception R-XX)

### R-03 — Limite de 100 linhas por arquivo

| Arquivo | Linhas | Motivo | Local |
|---------|--------|--------|-------|
| `src/components/scoring/use-edit-score-calculator.ts` | 150 | Hook de wiring React (`useMemo`) da API do calculator. Toda lógica de decisão vive em módulos puros `src/core/scoring/edit-score-calculator.*.ts` (≤100L cada). | Linha 1 |
| `src/app/api/gestor/coaches-logic.ts` | 113 | Estrutura de transação de `createCoach` (usuário + membership + passwordResetRequest) não se presta a divisão adicional sem prejudicar atomicidade. `ensureCanInsertAthletesColumn` extraído para `coaches-migration.logic.ts`. | Linha 1 |
| `src/schemas/match.ts` | 343 | Schema declarativo canônico dos contratos de partida (Zod); ausência de lógica imperativa. Isenção declarada no topo do arquivo. | Linha 1 |

### R-29 — Substituição de `window.confirm` por `AlertDialog`

| Arquivo | Decisão | Local |
|---------|---------|-------|
| `src/hooks/edit-score-preconditions.logic.ts` | `checkEditScorePreconditions` aceita `onConfirm` callback opcional. `window.confirm` mantido como fallback quando `onConfirm` não é fornecido. | Linha do parâmetro `onConfirm` |
| `src/app/gestor/use-coaches-table.ts` / `coaches-table.tsx` | Substituído `window.confirm` nativo pelo componente acessível WAI-ARIA `ConfirmAlertDialog` com foco seguro e tratamento de escape. | `coaches-table.tsx` |
| `src/app/gestor/gestor-match-actions.logic.ts` / `dashboard.tsx` | Substituído `window.confirm` nativo pelo modal `ConfirmDeleteMatchDialog` integrado ao tema e gerenciado no `GestorDashboardModals`. | `dashboard.tsx` |

## RLS (Row Level Security)

### Tabelas com RLS nativo habilitado

| Tabela | Migration | Policies |
|--------|-----------|----------|
| `users` | Existente (prévia) | Por `current_user_id` / role |
| `Player` | Existente (prévia) | Por `current_user_id` |
| `Match` | Existente (prévia) | Por `createdByUserId` / participantes |
| `PointLog` | Existente (prévia) | Por partida/usuário |
| `match_annotation_sessions` | Existente (prévia) | Por partida/annotator |
| `annotation_endorsements` | Existente (prévia) | Por sessão/usuário |
| `match_score_edits` | Existente (prévia) | Por partida/usuário |
| `match_comments` | Existente (prévia) | Por partida/usuário |
| `training_centers` | Existente (prévia) | Por CT/membro |
| `player_cts` | Existente (prévia) | Por CT/jogador |
| `memberships` | Existente (prévia) | Por CT/usuário |
| `guardian_links` | `20261028020000_add_rls_policies_remaining_tables` | Por guardião/jogador/plataforma |
| `consent_records` | `20261028020000_add_rls_policies_remaining_tables` | Por guardião/jogador/plataforma |
| `athlete_claims` | `20261028020000_add_rls_policies_remaining_tables` | Por usuário/plataforma |
| `link_invites` | `20261028020000_add_rls_policies_remaining_tables` | Por criador/CT/plataforma |
| `password_reset_requests` | `20261028020000_add_rls_policies_remaining_tables` | Por usuário/plataforma |
| `audit_logs` | `20261028020000_add_rls_policies_remaining_tables` | Por ator/plataforma |
| `clubs` | `20261028020000_add_rls_policies_remaining_tables` | Por CT/plataforma |
| `tournaments` | `20261028020000_add_rls_policies_remaining_tables` | Por criador/CT/plataforma |

### Migration bloqueadora corrigida

`20261027050000_assign_suporte_membership` — Adicionado `INSERT` do usuário `cmvprb36c0000ybsvjw14ca2u` antes do `INSERT` em `memberships` para respeitar FK `memberships_userId_fkey`.

## Autorização de partidas (V-14 resolvida)

Eliminado o acoplamento incorreto `match.player1Id === currentUserId` (comparava ID de Player com ID de User). A autorização agora usa `canReadMatch`/`canAnnotateMatch` de `src/core/access/visibility.ts`, que valida estritamente `athletePlayerId` (resolvido a partir de `Player.userId === currentUserId`).

## Validação Zod (V-12 resolvida)

Todos os 8 endpoints pendentes validam entrada com Zod:
- `point` — `PointFlowInputSchema`
- `finish` — `FinishMatchInputSchema`
- `state` — `MatchStateInputSchema`
- `sessions` (POST) — `StartSessionInputSchema`
- `endorse` — `SessionPathParamsSchema`
- `abandon` — `MarkSessionAbandonedInputSchema`
- `suspended-sessions` — query params (sem body)
- `tournament-suggestions` — `TournamentSuggestionsQuerySchema` (query params)

## Logs de produção (V-02, V-03 resolvidos)

`console.log`/`console.debug` removidos de produção. `logger-point.ts` usa `console.error` para erros (sempre ativo) e `devLog` (condicionado por `isDevelopment`) para logs de informação. `logger-dev.helpers.ts` mantém `devLog`/`devDebug`/`devError` condicionados.

## Testes de caracterização (V-15 resolvida)

Baseline `pnpm test:strict` 100% verde (3904/3904 testes, 397 suítes). Não há falhas pré-existentes.

## Rotas de leitura com `withAccessHandler` (V-14 parcial)

Migradas de `withRLSHandler` para `withAccessHandler`:
- `players/route.ts` (GET, POST)
- `players/[id]/route.ts` (GET apenas; PUT/PATCH/DELETE mantidos em `withRLSHandler` pois `athlete:update` é restritivo na matriz de perfis)
- `players/pool/route.ts` (GET)
- `invites/accept/route.ts` (POST)
- `admin/users/route.ts` (GET, POST)
- `admin/users/[id]/route.ts` (PATCH, DELETE)
- `matches/[id]/route.ts` (GET, PUT, PATCH, DELETE)
- `matches/[id]/point/route.ts` (POST)
- `matches/[id]/finish/route.ts` (POST)
- `matches/[id]/state/route.ts` (PATCH, POST)
- `matches/[id]/sessions/route.ts` (GET, POST)
- `matches/[id]/sessions/[sessionId]/endorse/route.ts` (POST)
- `matches/[id]/sessions/[sessionId]/abandon/route.ts` (POST)
- `matches/suspended-sessions/route.ts` (GET)
- `matches/tournament-suggestions/route.ts` (GET)

## Glossário (V-06 resolvido)

`docs/glossario.md` seção 8 desambigua:
- **CT** (`TrainingCenter`) — Centro de Treinamento, dono dos dados (tenant)
- **Club** (`Club`) — Apenas referência (adversário de fora, local da partida)

## Banco de dados e Pooler (R-40, V-06)

- **Configuração de Conexão no Neon (Serverless Postgres):**
  - `DATABASE_URL`: Utiliza o host do Pooler do Neon (PgBouncer em modo transaction, porta 5432) com parâmetro explícito `connection_limit=1` para funções serverless (Vercel Lambdas), prevenindo esgotamento de conexões sob concorrência.
  - `DIRECT_URL`: Conexão direta com o nó computacional primário do Neon (`directUrl` no `schema.prisma`), necessária para operações que exigem prepared statements de sessão, comandos DDL e migrações estruturais via `prisma migrate deploy` ou `prisma db push`.
- **Dimensionamento:**
  - Em ambiente serverless Vercel, cada execução de rota instância uma conexão sob demanda limitada a 1 conexão ativa por contêiner. O PgBouncer no Neon faz a multiplexação transparente para as instâncias de Postgres subjacentes.
  - Em desenvolvimento local, `DIRECT_URL` e `DATABASE_URL` apontam diretamente para a instância local do Postgres (`racket_mvp`), com injeção automática e validação no pré-voo (`scripts/db/preflight.ts`).

## Governança e LGPD (R-38)

### Encarregado pelo Tratamento de Dados Pessoais / DPO (CF-08, V-18)

- **Identificação:** Encarregado de Proteção de Dados da BE SMART LTDA (CNPJ 55.405.487/0001-84).
- **Canal Oficial de Atendimento ao Titular e ANPD:** `suporte@omni-sistemas.com` (atendimento a direitos previstos no art. 18 da LGPD e comunicações formais).
- **Competências:** Aceitar reclamações e comunicações dos titulares, prestar esclarecimentos, receber comunicações da Autoridade Nacional de Proteção de Dados (ANPD) e adotar providências imediatas.

### Inventário de Operadores e Subprocessadores (CF-11, V-10)

Em conformidade com os artigos 37 e 39 da LGPD:

| Operador / Subprocessador | Serviço Prestado | País / Região | DPA / Base Contratual | Dados Tratados |
|---|---|---|---|---|
| **Vercel Inc.** | Hospedagem de infraestrutura web, Edge Network e execução Serverless (Next.js App Router) | EUA / Global | Data Processing Addendum (DPA) corporativo com Cláusulas Contratuais Padrão (SCC) | Logs de tráfego HTTP, IP transitório de requisição, cookies criptografados |
| **Neon Inc.** | Banco de dados relacional PostgreSQL Serverless gerenciado | Brasil (Região São Paulo / `sa-east-1`) | Termos de Serviço e DPA empresarial do Neon | Tabelas da aplicação, dados cadastrais, telemetria de partidas e binários de notas de áudio |
| **Provedor de E-mail Transacional** (Resend / AWS SES) | Envio de mensagens transacionais essenciais (recuperação de senha, aviso de tutela e links de ativação) | EUA / Global | Termos de Serviço / DPA com SCC | E-mail de destino, nome do destinatário e tokens temporários de link |

### Runbook de Resposta a Incidentes de Segurança (CF-09, V-09)

Procedimento operacional para cumprimento do art. 48 da LGPD e Resolução CD/ANPD nº 15/2024:

1. **Gatilhos de Incidente:**
   - Detecção de acesso não autorizado, vazamento, alteração indevida ou destruição de dados pessoais, especialmente envolvendo atletas menores de idade ou credenciais de acesso.
   - Detecção de intrusão, exploração de vulnerabilidade ou anomalia severa em logs de auditoria (`AuditLog`).
2. **Comitê de Resposta Imediata:**
   - Decisores: DPO BE SMART LTDA + Responsável Técnico de Infraestrutura + Gestor de Operações.
   - Contato de acionamento imediato: `suporte@omni-sistemas.com`.
3. **Prazo Regulatório Mandatório:**
   - Comunicação à ANPD e aos titulares afetados em até **3 (três) dias úteis**, contados do conhecimento do fato, caso o incidente possa acarretar risco ou dano relevante aos direitos e liberdades fundamentais dos titulares.
4. **Canais de Comunicação:**
   - **À ANPD:** Peticionamento via Sistema Eletrônico de Informações (SEI/ANPD) ou formulário oficial de comunicação de incidente no portal gov.br/anpd.
   - **Aos Titulares / Responsáveis Legais:** Disparo de e-mail informativo aos endereços cadastrados e publicação de banner urgente na plataforma autenticada.
5. **Conteúdo Obrigatório da Notificação:**
   - Descrição da natureza e categorias dos dados pessoais afetados (destacando se há dados de menores de idade).
   - Informações sobre os titulares envolvidos (número estimado ou exato).
   - Indicação das medidas de segurança técnicas e administrativas utilizadas para proteção dos dados.
   - Riscos potenciais decorrentes do incidente.
   - Motivos da demora, caso a comunicação não tenha sido imediata.
   - Medidas que foram ou que serão adotadas para reverter ou mitigar os prejuízos.
6. **Rastreabilidade e Contenção Técnica:**
   - Consulta imediata à tabela `audit_logs` filtrando pelo período e ator afetado.
   - Em caso de comprometimento de credenciais, execução imediata de incremento de `sessionVersion` em massa (`prisma.user.updateMany`) para revogar todas as sessões ativas globalmente.
   - Preservação de logs brutos da Vercel e snapshots de WAL do Neon para auditoria forense.

## Segurança e Infraestrutura (R-41)

### Salvaguardas de Infraestrutura e Resiliência (SB-14, SB-18, SB-21, SB-23 / V-16, V-17)

- **WAF e Proteção de Borda (SB-14):**
  - Implementado via Vercel Edge Network com mitigação nativa de DDoS em camadas 3/4 e 7.
  - Verificação de cabeçalhos de segurança (`Origin`, `Referer` vs `host`) no middleware de aplicação (`middleware.ts`), prevenindo ataques de CSRF e requisições malformadas cross-origin.
- **Backups e Recuperação de Desastres (SB-18):**
  - Banco gerenciado Neon com Point-in-Time Recovery (PITR) contínuo através de retenção de WAL.
  - Snapshots diários automatizados com criptografia AES-256 em repouso.
  - Procedimento de restauração validado em ambiente isolado via export/import de schema e replicação de branch Neon.
- **Alertas de Anomalia e Monitoramento (SB-21, V-16):**
  - Registro imutável de falhas de autenticação na tabela `login_attempts` (`status: FAILED`).
  - Trilha imutável em `audit_logs` para operações administrativas, concessões de acesso do suporte (`SupportAccessRequest`) e eventos de consentimento (`consent_events`).
  - Destino operacional de alertas: canal técnico de monitoramento e painel de observabilidade da Vercel/Neon com alertas de erro 5xx e latência anormal.
- **Content Security Policy Ativa (SB-15 / V-08):**
  - Migrado o cabeçalho de `Content-Security-Policy-Report-Only` (observacional) para `Content-Security-Policy` ativo e restritivo em `next.config.ts`.
  - Eliminado `'unsafe-eval'` em ambiente de produção (`process.env.NODE_ENV === 'production'`), bloqueando injeções de código em tempo de execução.
  - Diretivas rígidas aplicadas em todas as rotas: `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`.

- **Eliminação de Fallback de Senha Previsível (V-03 / R-41):**
  - Removida a aceitação de data de nascimento (`DDMMYYYY`) como senha válida em `src/app/api/auth/login/authenticate.ts`.
  - Todas as autenticações exigem validação criptográfica estrita via `bcrypt.compare(password, user.passwordHash)`.
  - Atletas e treinadores cadastrados por gestores devem realizar o primeiro acesso através do fluxo de convite temporário (`LinkInvite` com token de uso único e TTL de 7 dias), com redefinição forçada de senha (`mustChangePassword: true`), sem nenhuma credencial implícita.

- **Proteção contra Vazamento de JWT no Cliente (SB-04 / V-05):**
  - Removida a emissão do cookie duplo não-HttpOnly `access_token` em `src/app/api/auth/login/login-response.logic.ts` e `src/app/api/auth/context/route.ts`.
  - A autenticação passa a residir exclusivamente no cookie `rkt_access_token` com flag `httpOnly: true`, inacessível para scripts de terceiros e resistente a ataques de Cross-Site Scripting (XSS).
  - Removida gravação e leitura de tokens em `sessionStorage` (`writeToSessionOnly`, `context-switcher.tsx`, `SessionContext.tsx`, `useSessionManager.lifecycle.ts`, `useCommentOfflineSync.ts`, `use-admin-page.ts`).
  - Qualquer resíduo de sessão em navegadores de clientes é limpo ativamente (`sessionStorage.removeItem('access_token')`).

- **Proteção contra Força Bruta e Lockout de Conta (SB-02 / V-01):**
  - Implementado em `src/app/api/auth/login/login-ratelimit.logic.ts`.
  - Habilitado por padrão em todos os ambientes (produção e desenvolvimento), operando em modo opt-out via flag explícita `DISABLE_LOGIN_RATELIMIT=true`.
  - Limite máximo de **5 tentativas falhas** por IP em uma janela deslizante de **5 minutos** (`MAX_LOGIN_ATTEMPTS = 5`, `LOGIN_WINDOW_MINUTES = 5`).
  - Ao exceder o limite, o endpoint bloqueia requisições retornando imediatamente status **HTTP 429 Too Many Requests** com código de erro `RATE_LIMIT_EXCEEDED` e cabeçalho `Retry-After: 300` (tempo de retenção em segundos).
  - Tentativas consecutivas menores (3 a 4 falhas) aplicam delay progressivo defensivo de até 2 segundos antes do lockout rígido.

- **Revogação de Sessão no Logout (SB-05 / V-07):**
  - Implementado em `src/app/api/auth/logout/route.ts` via `bumpSessionVersion(auth.id)`.
  - O logout não se limita a zerar os cookies no cliente (`maxAge: 0`); ele incrementa atomicamente o contador `sessionVersion` no banco de dados e invalida os caches de autorização (`invalidateActor`, `invalidateSessionCache`), revogando imediatamente no servidor qualquer token JWT anteriormente emitido antes do término do seu TTL.

- **Separação Rígida de Ambientes (SB-23):**
  - **Development:** Conexão obrigatória em banco local (`racket_mvp` via loopback `localhost:5432`), carregado por `DATABASE_URL_DEV`.
  - **Test:** Conexão obrigatória em banco local dedicado (`racket_mvp_test`), isolado para testes unitários, integração e Playwright, via `DATABASE_URL_TEST`.
  - **Production:** Banco na nuvem gerenciado no Neon (`*.neon.tech`), provisionado com TLS obrigatório (`sslmode=require`).
  - **Guarda Ativa:** Validada deterministicamente pela função `assertDbTarget()` em `src/lib/db/db-target.ts` em toda inicialização do Prisma; tentativa de apontar processo de desenvolvimento para a nuvem falha imediatamente com exceção `DbTargetError`.

## Central de Ajuda (`/help`) — 2026-11-26

Decisões registradas no plano aprovado `docs/PLANO_CENTRAL_DE_AJUDA_2026-11-26.md`:

- **Formato do conteúdo:** MDX versionado no repo (`@next/mdx@15.5.19` + peer `@mdx-js/loader@3`), manifesto em `content/help/index.ts` (fora de `src/`, logo fora do guard R-03 que varre apenas `src/`). Estilos dos elementos MDX em `src/mdx-components.tsx` (padrão oficial `providerImportSource`).
- **Acesso:** `/help` somente logado — `'/help/:path*'` no matcher de `src/middleware.ts`, fora de `PUBLIC_ROUTES`. Perfil resolvido no servidor via header `x-active-area` (sem client-fetch).
- **Escopo de perfis:** Atleta, Treinador, Gestor, Responsável, Espectador e Anotador. **ADMIN e SUPORTE ficam de fora** — item `AJUDA` do rodapé é condicional (`hasHelpContent(area)`; no fallback sem área, oculta apenas ADMIN/SUPORTE).
- **Neutralidade de rota:** `/help` (exato) e prefixo `/help/` em `app-path.logic.ts` — sem isso, `appPath`/`DashboardChrome` navegariam para `/atleta/help` etc.
- **Texto legal nunca duplicado:** artigos do Responsável linkam para `/termos/responsavel` e `/privacidade`.
- **Busca full-text:** fase 2 (Fuse.js/Pagefind), fora da Fundação.
- **`jsxImportSource` do MDX:** o projeto usa `react@18.3.1` mas o App Router do Next 15.5 roda no React vendorizado (19). O MDX compilado importa `react/jsx-runtime` (React 18) e quebra lendo internals renomeados (`ReactCurrentOwner`) — corrigido com `createMDX({ options: { jsxImportSource: 'next/dist/compiled/react' } })` em `next.config.ts`, alinhando o MDX ao runtime do resto do app sem trocar a versão de `react` do projeto (fora do escopo da fatia).
- **Débito R-03 corrigido (decisão do usuário):** 17 arquivos >100L pré-existentes no HEAD divididos em módulos coesos (re-export preservando contratos públicos); `pnpm check:r03` verde sem `--update` da baseline.
- **Drift código×teste corrigido (decisão do usuário):** 11 suítes / 60 testes atualizados ao comportamento dos commits recentes (só testes). Semântica do engine (`b933089`): o canônico vence no game 1 — os2 testes de 17/10 foram atualizados à semântica nova (arquivo de regressão dedicado de 20/11 permanece como cobertura).
- **Fade global do tema restaurado (decisão do usuário):** o split `d1806c9` perdeu os blocos "Transição suave de tema (0.3s, desde `6ff3f9d`)" e "Overrides de interação"; restaurados em `src/app/css/utilities/transitions.css` — mudança de produção mínima, com `theme-fade-transition.test.ts` atualizado para congelar o 0.3s nos módulos pós-split.
- **Guard de lint (divergência deliberada da config canônica STE-DEV):** o projeto mantém ESLint 8 + `.eslintrc.json` (`next/core-web-vitals` + `jsx-a11y`) executado via `pnpm lint` (`next lint`), em vez do `assets/eslint.config.mjs` (flat config / typescript-eslint com `complexity`, `max-lines`, `no-explicit-any`) da skill STE-DEV 3.4.1. R-03 segue garantido por `pnpm check:r03` (script próprio com baseline ratchet) e os testes continuam sob `pnpm test:strict`. Motivo: adotar a flat config exigiria migração de todo o lint em uma fatia sem relação com o objetivo — risco/benefício desfavorável, mantido o guard atual conforme decisão do usuário (D4 do plano).

