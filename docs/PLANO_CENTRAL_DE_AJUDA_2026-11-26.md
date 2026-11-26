# PLANO — Central de Ajuda (`/help`) — 2026-11-26

> **Status:** Aprovado pelo usuário (spec + Fatia 1 autorizada).
> **Metodologia:** Elephant → Goldfish (audit PASS na 2ª rodada) → execução cirúrgica (Fase 3 EGM) sob regras STE-DEV 3.4.1.

## 1. Objetivo

Criar uma **Central de Ajuda** acessível em `/help`, com conteúdo consciente do perfil do usuário (Atleta, Treinador, Gestor, Responsável, Espectador, Anotador), glosário de tênis/sistema, FAQ, entrada no menu do drawer e botão flutuante em telas sem menu (`/scoring`).

## 2. Decisões registradas (capturadas do usuário)

| # | Decisão | Escolha |
|---|---------|---------|
| D1 | Formato do conteúdo | **MDX versionado no repo** (`@next/mdx`), em `content/help/**` (fora de `src/`, isento do guard R-03) |
| D2 | Acesso | `/help` **somente logado**; resolução de perfil via headers `x-active-area`/`x-user-role` do middleware (sem client-fetch) |
| D3 | Escopo de perfis | Atleta, Treinador, Gestor, Responsável (nível máximo de detalhe), Espectador, Anotador. **ADMIN e SUPORTE ficam de fora** |
| D4 | Guard de lint | **Manter** o guard atual (`pnpm check:r03` + baseline ratchet + `next lint`); divergência da config canônica STE-DEV registrada em `docs/ste-dev.md` |

Restrições permanentes:

- Texto legal **nunca duplicado**: artigos do Responsável linkam para `/termos/responsavel` e `/privacidade`.
- Busca full-text (Fuse.js/Pagefind) é **fase 2**, fora desta entrega.
- Nenhum `eslint-disable` / `@ts-ignore` / `ste-exception` sem aprovação registrada do usuário.

## 3. Arquitetura

```
content/help/                        ← conteúdo MDX versionado (fora de src/, fora do R-03)
  index.ts                           ← manifesto: slugs, títulos, descrições, componentes
  atleta/por-onde-comecar.mdx        ← artigo (esqueleto na Fatia 1)
src/core/help/
  help-perfil.logic.ts               ← mapeamento puro AreaCode → slug + hasHelpContent(area)
src/app/help/
  layout.tsx                         ← casca comum (logo, metadata, noindex, rodapé)
  page.tsx                           ← landing dinâmica: lê x-active-area → redirect /help/<slug>
  [perfil]/page.tsx                  ← lista de artigos do perfil (SSG via generateStaticParams)
  [perfil]/[slug]/page.tsx           ← artigo (SSG; MDX renderizado via manifesto)
src/mdx-components.tsx               ← estilos dos elementos MDX (padrão oficial Next)
src/types/mdx.d.ts                   ← declaração de módulo '*.mdx'
```

Fluxo de dados:

1. `middleware.ts` (matcher inclui `/help/:path*`, **fora** de `PUBLIC_ROUTES`) autentica e seta `x-active-area`.
2. `app-path.logic.ts` trata `/help` e `/help/*` como **rotas neutras** para `appPath`/`isNeutralRoute` — sem isso, `DashboardChrome` (linha 72) navegaria para `/atleta/help`.
3. Landing `GET /help` redireciona para o slug do perfil; `ADMIN`/`SUPORTE` (sem conteúdo) caem em `/dashboard` (lógica de legado do middleware os leva à home da área).
4. Item `AJUDA` no rodapé do drawer é **condicional**: `hasHelpContent(area)` no caminho com área; no fallback (sem `area`) oculta apenas `ADMIN`/`SUPORTE`.

## 4. Fatias

| Fatia | Escopo | Status |
|-------|--------|--------|
| **1 — Fundação** | Pipeline MDX + rota `/help` autenticada + 1 artigo esqueleto (Atleta) + item de menu condicional + neutralidade de rota + testes | **Concluída** — `next build` verde (rotas `/help` SSG), `typecheck` ✓, `lint` ✓, `check:r03` ✓, testes-alvo ✓ |
| 2 — Conteúdo por perfil | Artigos dos 6 perfis, glosário e FAQ (MDX por seção) | Pendente |
| 3 — Descoberta | Busca full-text (Fuse.js ou Pagefind) | Pendente |
| 4 — Integração scoring | Botão flutuante "Ajuda" em `/scoring` (montado em `scoring-page-layout.tsx`) | Pendente |

## 5. Mapa de arquivos da Fatia 1

**Novos**

- `content/help/index.ts`, `content/help/atleta/por-onde-comecar.mdx`
- `src/core/help/help-perfil.logic.ts` + `src/core/help/__tests__/help-perfil.test.ts`
- `src/app/help/layout.tsx`, `src/app/help/page.tsx`
- `src/app/help/[perfil]/page.tsx`, `src/app/help/[perfil]/[slug]/page.tsx`
- `src/mdx-components.tsx`, `src/types/mdx.d.ts`

**Alterados**

- `next.config.ts` — `createMDX()` + `/help` em `noindexSources`
- `tsconfig.json` — alias `@content/*` → `./content/*`
- `src/core/access/menu-items.ts` — const `AJUDA`
- `src/core/access/menu.ts` — `canSeeHelp` condicional no rodapé
- `src/core/access/app-path.logic.ts` — `/help` neutro (exato + prefixo `/help/`)
- `src/middleware.ts` — `'/help/:path*'` no matcher
- `src/core/access/__tests__/menu.test.ts`, `app-path.test.ts`, `src/__tests__/area-links.guard.test.ts` — asserts atualizados/estendidos

**Quebras deliberadas de teste:** 4 asserts de rodapé em `menu.test.ts` passam a esperar `ajuda` nos perfis com conteúdo (Gestor/Treinador/Atleta/…) e `['sair']` apenas para ADMIN/SUPORTE.

## 6. Gates (STE-DEV 3.4.1)

```
rtk pnpm typecheck && rtk pnpm lint && rtk pnpm check:r03
node scripts/run-tests.js --ci menu help app-path area-links
rtk pnpm test:strict        # fechamento (baseline completa)
```

Observação: `next build` (ou `next dev`) deve rodar antes do `typecheck` para regenerar `.next/types/routes.d.ts` com as rotas `/help/*` sob `typedRoutes: true`.

## 7. Auditoria Goldfish

- **Rodada 1:** REVISE — apontou: neutralidade de rota ausente (`appPath` prefixaria `/help`), fallback de `footerItems` sem `area`, ausência de `generateStaticParams`/`notFound`, matcher do middleware e `noindexSources`.
- **Correções aplicadas → Rodada 2: PASS.**
- **Ressalva registrada:** `footerItems(ctx)` no fallback (`menu.ts`, caminho sem `activeArea`) precisa tratar `area === undefined` — resolvida por `canSeeHelp(ctx, area)` (oculta apenas ADMIN/SUPORTE quando não há área).

## 8. Riscos e observações

- `content/**` é typecheckado pelo `tsc` (include `**/*.ts`) mas não entra no guard R-03 (que varre apenas `src/`).
- Testes não podem importar o manifesto (`content/help/index.ts`) — ele importa `.mdx`, que o Jest não transforma. Testes cobrem apenas lógica pura (`help-perfil.logic.ts`) e integração de menu/rotas.
- `/scoring` já opera em zona de aviso R-03 (96L); o botão flutuante da Fatia 4 deve montar em `scoring-page-layout.tsx` (91L) ou extrair componente.

## 9. Descoberta de execução — `jsxImportSource` do MDX

O projeto declara `react@^18.3.0` (instalado 18.3.1), mas o App Router do Next 15.5 executa no **React vendorizado** (`next/dist/compiled/react`, React 19). O output compilado do MDX importa `react/jsx-runtime` por padrão, resolvendo para o jsx-runtime do React 18 — que lê `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner`, interior renomeado no React 19 → `TypeError` na coleta de dados das páginas (`Failed to collect configuration for /help/...`).

**Correção:** `createMDX({ options: { jsxImportSource: 'next/dist/compiled/react' } })` em `next.config.ts` — o MDX passa a usar exatamente o runtime do resto da aplicação (`jsx-runtime`/`jsx-dev-runtime` vendorizados). Não altera `react` do projeto (fora do escopo da fatia).

## 10. Correção R-03 (débito pré-existente no HEAD — decidida pelo usuário em 2026-11-26)

O `pnpm check:r03` falhava com **17 arquivos >100L** acumulados em commits anteriores (suporte/doubles/spectate desde a baseline `696de44`) — nenhum tocado pela Fatia 1. Decisão: **corrigir agora**, extraindo módulos coesos sem mudança de comportamento (re-export mantém os contratos públicos). **Resultado: `check:r03` verde** (2 violações congeladas na baseline, 0 regressões; todos os 17 ≤100L).

| Arquivo (L) | Extração |
|---|---|
| `api/gestor/coaches/[id]/regenerate-link/route.ts` (102) | `regenerate-link-issue.logic.ts` (`issueCoachLink`, espelho do padrão de athletes) |
| `api/matches/[id]/sessions/[sessionId]/route.ts` (110) | `session-end-update.logic.ts` (`buildEndSessionUpdate` + `serializeState`) |
| `api/players/players-post.logic.ts` (110) | `players-post-preflight.logic.ts` (`actorCreatingProfile` + fallback de clube) |
| `api/suporte/externos/externos-query.logic.ts` (162) | `externos-fetch.logic.ts` (3 funções Prisma) + re-export |
| `dashboard/components/DashboardMatchModals.tsx` (103) | `dashboard-server-modal.tsx` (bloco de seleção de sacador) |
| `match/[id]/scoring/use-scoring-annotation-callbacks.ts` (120) | `use-scoring-serve-callbacks.ts` (callbacks de saque) |
| `match/[id]/scoring/useScoringLifecycleEffects.ts` (102) | `scoring-lifecycle-route.logic.ts` (efeito de redirecionamento inicial) + remoção de `useEffect` vazio |
| `matches/acompanhar/[matchId]/SpectatorHeader.tsx` (106) | `SpectatorStatusBadge.tsx` (badge de status) |
| `matches/convite/[token]/page.tsx` (155) | `invite-error-states.ts` (dados) + `invite-error-view.tsx` (componente) |
| `suporte/emitir-senha-modal.tsx` (218) | `use-emitir-senha.ts` (estado/handlers) + `emitir-senha-step-search.tsx` + `emitir-senha-step-result.tsx` |
| `suporte/suporte-page-content.tsx` (116) | `use-suporte-actions.ts` (4 handlers de mutação) |
| `components/scoring/PointAnnotationBars.tsx` (105) | `point-annotation-cancel-row.tsx` (linha de cancelamento) |
| `components/scoring/SetSummaryModal.tsx` (111) | `set-summary-body.tsx` (corpo rolável) |
| `components/scoring/SetupModal.tsx` (112) | `setup-modal-doubles.tsx` (ramo de duplas) |
| `core/scoring/engine-from-serialized.ts` (111) | `engine-server-fix.logic.ts` (normalização/correção de sacador) + re-export |
| `hooks/use-offline-sync.flush.ts` (111) | `use-offline-sync.stuck.ts` (`dispatchStuckEventIfNeeded`) + helper de pausa por auth + re-export |
| `services/spectator-concession.service.ts` (106) | `spectator-redeem.service.ts` (`redeemShareLink`) + re-export |

## 11. Correção das 11 suítes pré-existentes (drift código×teste — decidida pelo usuário em 2026-11-26)

A suíte completa no HEAD falhava com **11 suítes / 60 testes** por drift dos commits recentes (nenhuma relacionada à Fatia 1). Decisão: **corrigir todas, só no lado do teste** (nenhuma mudança de produção, exceto a restauração aprovada do fade). Causa raiz e correção por suíte:

| Suíte (falhas) | Causa raiz | Correção |
|---|---|---|
| `use-serve-inline-controls` (18) | `cadfda2` adicionou guardas `state.open('setup')` sem atualizar a fixture | fixture com `match.initialServerId` + `open: jest.fn()` |
| `point-details-logic` (2) | `929b9ea` expandiu `getGolpeOptions` (passada/rede) sem atualizar asserções | expectativas para `['fh','bh','vfh','vbh','smash']` |
| `spectator-concession` (1) | `929b9ea` passou a limitar lotação só em partidas CIRCLE | fixture `visibility: 'CIRCLE'` + mock de `canUserAccessCircleMatch` |
| `engine.fromSerialized.serverId` (2) | `b933089` removeu a guarda `startedAt == null` e passou a fazer o canônico vencer no game 1 (semântica nova com arquivo de regressão dedicado) | **decisão do usuário:** atualizar os2 testes de 17/10 à semântica atual |
| `theme-fade-transition` (13) | `d1806c9` perdeu os blocos de tema no split do CSS; `6ff3f9d` tinha mudado 2s→0.3s | **restauração aprovada** do bloco de tema + overrides em `css/utilities/transitions.css` e leitura dos módulos no teste |
| `dual-theme.characterization` (6) | tokens/bordas migraram para `css/tokens/*` e `css/utilities/borders.css`; scoring ganhou `h-[100dvh]`; `ThemeToggleButton` ganhou `className` | concatenação dos módulos + novas strings |
| `court-pill` (3) / `outdoor-theme` (1) | blocos migraram para `css/components/court-pill.css` e `css/tokens/outdoor-theme.css` | leitura dos módulos |
| `can.matrix` (9) | `profile-matrix.ts` ganhou `finance:*` (ADMIN/SUPORTE) e perdeu `support:access:approve`/`audit:read` | tabela EXPECTED espelhando a matriz atual |
| `page.confirm-dialog` (1) | auth migrou para cookie httpOnly (`deleteUser(id, null)`) | asserção focada em id + método (sem header Bearer) |
| `PointFlowInputSchema` (1) | `flexibleIdValidator` mudou a mensagem | mensagem atual esperada |
