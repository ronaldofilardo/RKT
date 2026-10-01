# DESIGN — RKT (Racket App)

> Design System extraído de `src/app/globals.css`, `src/app/design-system.css` e `tailwind.config.ts` (RE-DOC).
> **Este é um dos 6 arquivos-canônicos do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.
> **Data da análise:** 2026-10-01 · **Commit:** `c53ae98`
> Identidade vigente: **Telemetry Design System (Broadcast-Grade)** com **Dual-Theme** (Light/Dark via `ThemeContext`).

---

## 1. Paleta de Cores — Telemetry (Dual Theme)

Tokens CSS em `src/app/globals.css`, consumidos pelo Tailwind como `rgb(var(--telemetry-*) / <alpha-value>)`.

### 1.1 Tema Dark (padrão broadcast)

| Token | Valor RGB | Hex | Uso |
|---|---|---|---|
| `--telemetry-base` | `10 15 29` | **#0A0F1D** | Canvas / fundo principal |
| `--telemetry-card` | `17 24 39` | **#111827** | Superfície de card |
| `--telemetry-elevated` | `30 41 59` | **#1E293B** | Superfície elevada / popover |
| `--telemetry-active` | `15 23 42` | **#0F172A** | Estado ativo / hover / tab |
| `--telemetry-border` | `255 255 255` | **#FFFFFF** | Borda (usada com opacidade ~8–10%) |
| `--telemetry-text-primary` | `248 250 252` | **#F8FAFC** | Texto primário |
| `--telemetry-text-muted` | `148 163 184` | **#94A3B8** | Texto secundário/metadata |
| `--telemetry-volt` | `204 255 0` | **#CCFF00** | Neon volt broadcast (destaque) |
| `--telemetry-blue` | `37 99 235` | **#2563EB** | Azul primário |
| `--telemetry-blue-light` | `59 130 246` | **#3B82F6** | Azul claro (links/ação secundária) |
| `--telemetry-orange` | `234 88 12` | **#EA580C** | Laranja saibro |
| `--telemetry-orange-light` | `226 88 34` | **#E25822** | Laranja claro |
| `--telemetry-error` | `239 68 68` | **#EF4444** | Erro |
| `--telemetry-alert` | `245 158 11` | **#F59E0B** | Alerta |
| `--telemetry-alert-light` | `251 191 36` | **#FBBF24** | Alerta claro |

### 1.2 Tema Light

| Token | Valor RGB | Hex | Uso |
|---|---|---|---|
| `--telemetry-base` | `241 245 249` | **#F1F5F9** | Canvas neutro |
| `--telemetry-card` | `255 255 255` | **#FFFFFF** | Card branco |
| `--telemetry-elevated` | `248 250 252` | **#F8FAFC** | Superfície elevada |
| `--telemetry-active` | `226 232 240` | **#E2E8F0** | Estado ativo / hover |
| `--telemetry-border` | `15 23 42` | **#0F172A** | Borda (com opacidade ~8–10%) |
| `--telemetry-text-primary` | `15 23 42` | **#0F172A** | Texto primário alto contraste |
| `--telemetry-text-muted` | `100 116 139` | **#64748B** | Texto secundário (WCAG AA) |
| `--telemetry-volt` | `101 163 13` | **#65A30D** | Verde limão tênis legível no claro |
| `--telemetry-blue` | `37 99 235` | **#2563EB** | Azul primário |
| `--telemetry-blue-light` | `59 130 246` | **#3B82F6** | Azul claro |
| `--telemetry-orange` | `234 88 12` | **#EA580C** | Laranja saibro |
| `--telemetry-orange-light` | `226 88 34` | **#E25822** | Laranja claro |
| `--telemetry-error` | `220 38 38` | **#DC2626** | Erro |
| `--telemetry-alert` | `217 119 6` | **#D97706** | Âmbar de alerta |
| `--telemetry-alert-light` | `245 158 11` | **#F59E0B** | Alerta claro |

Ativação de tema: `darkMode: ['class', '[data-theme="dark"]']` (`tailwind.config.ts`) — alternância binária Light/Dark via `ThemeToggle` + `ThemeContext`.

---

## 2. Paleta Legada (`tailwind.config.ts` → `theme.extend`)

Mantida por compatibilidade (comentário do próprio arquivo: *"Migrar gradualmente para tokens acima"*):

| Grupo | Tokens | Hex |
|---|---|---|
| **Texto** | `fg` / `fg-2` / `fg-muted` | `#181d26` · `#333333` · `rgba(4,14,32,.69)` |
| **Fundo** | `bg` / `bg-2` / `bg-3` | `#ffffff` · `#f8f9fa` · `#f0f2f5` |
| **Borda** | `border` / `border-soft` | `#e0e2e6` · `#eef0f3` |
| **Acento** | `accent` / `-hover` / `-active` / `-light` | `#1b61c9` · `#254fad` · `#143d8d` · `#e8f0fe` |
| **Estado** | `success` (+light) · `warn` (+light) · `danger` (+light) | `#006400`/`#d4edda` · `#eab308`/`#fef3c7` · `#dc2626`/`#fee2e2` |
| **Tênis** | `court-hard` · `court-clay` · `court-grass` · `ball` · `net` | `#4a90d9` · `#c05621` · `#48bb78` · `#ccff00` · `#1a202c` |
| **Sky (legado)** | 50/100/500/600/700 | `#f0f9ff` `#e0f2fe` `#0ea5e9` `#0284c7` `#0369a1` |
| **Emerald (legado)** | 50/100/500/600/700 | `#ecfdf5` `#d1fae5` `#10b981` `#059669` `#047857` |

> ⚠️ As classes genéricas `sky-*`/`emerald-*` são **proibidas** em `/scoring`, `/dashboard`, `/match/new`, `/atletas` (guardrail — `RULES.md` §10).

---

## 3. Tipografia

### 3.1 Famílias

| Token | Stack |
|---|---|
| `--font-display` / `font-display` | `'Haas Groot Disp', Haas, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `--font-body` / `font-body` | `Haas, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `--font-mono` / `font-mono` | `ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', monospace` |
| `font-geist` | `var(--font-geist-sans), sans-serif` (pacote `geist`) |
| `font-space-grotesk` | `var(--font-space-grotesk), sans-serif` |
| `--font-main` (`globals.css`) | `Inter, system-ui, -apple-system, sans-serif` |

### 3.2 Escala de tamanhos (mobile-first)

| Token Tailwind | CSS var | Tamanho | Line-height | Letter-spacing |
|---|---|---|---|---|
| `text-airtable-xs` | `--text-xs` | 12px | 1.35 | 0.28px |
| `text-airtable-sm` | `--text-sm` | 14px | 1.35 | 0.28px |
| `text-airtable-base` | `--text-base` | 16px | 1.35 | 0.18px |
| `text-airtable-lg` | `--text-lg` | 20px | 1.35 | 0.10px |
| `text-airtable-xl` | `--text-xl` | 24px | 1.25 | 0.12px |
| `text-airtable-2xl` | `--text-2xl` | 32px | 1.25 | — |
| `text-airtable-3xl` | `--text-3xl` | 40px | 1.25 | — |
| `text-airtable-4xl` | `--text-4xl` | 48px | 1.15 | — |

Extras: `--leading-body: 1.35`, `--leading-tight: 1.2`, `--tracking-display: 0`.
Sobrescrita local: `.text-4xl { font-size: 1.75rem; }` em `globals.css:283`.

---

## 4. Espaçamento, Raio, Elevação e Movimento

| Categoria | Tokens |
|---|---|
| **Espaço (base 4px)** | `space-1:4` `space-2:8` `space-3:12` `space-4:16` `space-5:20` `space-6:24` `space-8:32` `space-12:48` |
| **Seção** | `section-y-desktop:96px` · `section-y-tablet:64px` · `section-y-phone:48px` |
| **Raio** | `radius-sm:12px` (botões) · `radius-md:16px` (cards) · `radius-lg:24px` · `radius-pill:9999px` |
| **Elevação** | `elev-flat:none` · `elev-ring:0 0 0 1px #e0e2e6` · `elev-raised:0 1px 32% + 0 2px 4px 8% + 0 8px 16px 8%` |
| **Focus** | `focus-ring:0 0 0 3px rgba(27,97,201,.3)` / `color-mix(in srgb, var(--accent) 30%, transparent)` |
| **Motion** | `motion-fast:150ms` · `motion-base:200ms` · `ease-standard:cubic-bezier(.2,0,0,1)` |
| **Container** | `max-w-container:1200px` · gutter desktop 24px / tablet 16px / phone 12px |
| **Breakpoints** | `sm:640` `md:768` `lg:1024` `xl:1280` `2xl:1536` |

---

## 5. Inventário de Componentes de UI

### 5.1 Base (`src/components/`)

| Componente | Descrição |
|---|---|
| `ThemeToggle.tsx` | Alternância binária Light/Dark (Telemetry) |
| `Toast.tsx` | Notificações (`useToast`) |

### 5.2 Scoring — `src/components/scoring/` (35 componentes)

**Placar/arena:** `ScoreboardCard`, `LiveCountersBar`, `CourtBackground`, `PlayerCard`, `MatchHeader`, `WinnerInfo`, `ContextBadges`, `pills-component`.
**Ações:** `ActionBar` (+ `.view`/`.sections`), `SetupModal`, `ServerEffectModal`, `SetSummaryModal`, `UndoConfirmModal`, `ModalActions`.
**Edição de placar:** `EditScoreModal`, `edit-score-form`, `edit-score-game-points`, `edit-score-summary`, `edit-score-tiebreak-inputs`, `EditScoreModalFooter`.
**Timeline/detalhes:** `MatchTimelineView`, `timeline-rows`, `timeline-filters`, `PointDetailsModal`, `point-details-section`, `PointDetailsNotesModal`, `PointDetailsCloseDialog`, `SectionRenderer`.
**Comentário/áudio:** `CommentModal`, `AudioNotePlayer`.
**Análise:** `GameErrorsHistogram`, `TacticalInsightBanner`, `AnnotationSessionPanel`.

### 5.3 Dashboard — `src/components/dashboard/`

`MatchCard.tsx`, `match-card-components.tsx` (+ helper `match-card-utils.ts`).

> Observação: `DeleteMatchModal` e `FinishMatchModal` **não existem mais** (removidos no saneamento de legado de 2026-10-01); a confirmação de exclusão é renderizada **inline** em `DashboardPage` (`matchToDelete && ...`, `src/app/dashboard/page.tsx:252`).

### 5.4 Report — `src/components/report/`

`AdvancedStats`.

### 5.5 Páginas (componentes locais)

- **Dashboard:** `DashboardTopBar`, `DashboardSidebar`, `DashboardViewRouter` (views `dashboard|annotated|live|pending|history`).
- **Atletas:** `AthleteSearchHeader`, `AthleteListTable`, `EditAthletePersonalFields`, `EditAthleteModal`, `RankingForm`.
- **Match/new (11 componentes + helpers):** `MatchNewHeader`, `PlayerSelection`, `AthleteDropdown`, `SportFormatSection`, `RoundSelector`, `DateTimeSection`, `MatchDetailsSection`, `NewAthleteModal`(+`NewAthleteModalForm`), `ServerSelectionModal`, `DuplicateMatchModal` — mais `index.ts` e `new-athlete-modal.helpers.ts`.
- **Scoring (página):** `ScoringPlayArea`, `ScoringModals`, `ScoringTimelineView`.
- **Report (página):** `ReportPage.view`.
- **Matches/locate:** `LocateMatchesView` (página atual contém apenas `page.tsx`).

---

## 6. Guardrails de Design Obrigatórios

```bash
pnpm test:design   # design-pattern.characterization + dual-theme.characterization + telemetry-integrity
```

Proibições vigentes (`RULES.md` §10):
- Remover/ignorar tokens `telemetry-*`.
- Reintroduzir `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-sky-*`, `bg-emerald-*` em `/scoring`, `/dashboard`, `/match/new`, `/atletas`.
- Reverter `/scoring` para quadra sólida opaca ou remover `ScoreboardCard`/`LiveCountersBar`.
- Ressuscitar `*.view.tsx`/`*.rows.tsx` legados pré-telemetria.
