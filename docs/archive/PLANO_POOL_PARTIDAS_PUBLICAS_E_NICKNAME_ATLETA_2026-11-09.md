# PLANO — Pool de Partidas Públicas e Nickname de Atleta

**Situações endereçadas:**
- **S1:** Múltiplos anotadores para a mesma partida real (anotações isoladas e soberanas via template público)
- **S2:** Nickname de atleta no pool público com consentimento para menores

**Data:** 2026-11-09  
**Status:** Planejamento Aprovado  
**Arquivos canônicos afetados:** `TASKS.md` (novas entradas A0.13 e A0.14) · `ARCHITECTURE.md` · `prisma/schema.prisma`

---

## 1. Premissas e Decisões de Design

### S1 — Pool de Partidas Públicas
| Decisão | Valor |
|---|---|
| **Cada anotação é soberana** | `PointLog` nunca é compartilhado entre usuários. Cada anotação é isolada. |
| **Template = cartaz** | Sem `MatchState` próprio; sem `PointLog`; apenas metadados do evento. |
| **Ciclo de vida do template** | Independente das derivadas; encerrado manualmente pelo criador. |
| **Pool é global** | Treinador do CT-A vê partidas do CT-B. |
| **Quem pode criar template** | Qualquer usuário (maior de idade); menor exige `ConsentRecord` ativo. |
| **Promoção de privada → pública** | Gestor pode promover partidas do próprio CT para o pool público. |
| **Edição do template** | Somente o criador; propaga automaticamente para derivadas em `SCHEDULED` ou `IN_PROGRESS`. |
| **Visibilidade de anotações** | Usuário vê só a própria; Gestor vê todas do seu CT; Admin/Suporte vê tudo. |
| **Relatório comparativo** | Não — cada anotação é 100% isolada. |

### S2 — Nickname de Atleta no Pool
| Decisão | Valor |
|---|---|
| **Natureza do nickname** | Escolhido pelo atleta; legível; único globalmente (`@unique`). |
| **Visibilidade no pool** | Opt-in explícito pelo atleta (`poolVisible: false` por padrão). |
| **Menor de idade** | `poolVisible` só pode ser `true` após `ConsentRecord` com `purpose: POOL_VISIBILITY` ativo. |
| **Distinção com athleteCode** | `athleteCode` = gerado pelo sistema, opaco; `nickname` = escolhido, legível. |
| **Fase de implementação** | Parcial agora (maior de idade); menores aguardam função de consentimento (A0.8). |

---

## 2. S1 — Pool de Partidas Públicas

### Visão Geral da Arquitetura
```text
Match (isPublicTemplate = true)    ← Cartaz no pool (sem PointLog próprio)
    ├── Match (sourceMatchId = X)  ← Anotação do usuário A (PointLog próprio)
    ├── Match (sourceMatchId = X)  ← Anotação do usuário B (PointLog próprio)
    └── Match (sourceMatchId = X)  ← Anotação do usuário C (PointLog próprio)
```
O template reutiliza o model `Match` existente com dois campos novos. Nenhuma tabela nova é necessária.

---

### Fase 0 — Characterization (Pré-requisito Obrigatório)
**Objetivo:** Travar o comportamento atual antes de tocar em qualquer módulo de partida.

**Arquivos a caracterizar:**
- `src/app/api/matches/route.ts` → `matches-route.characterization.test.ts`
- `src/app/match/new/useNewMatchState.ts` → `useNewMatchState.characterization.test.ts`
- `src/app/match/new/build-match-payload.logic.ts` → `build-match-payload.characterization.test.ts`
- `src/services/matchService.ts` (ou equivalente) → `matchService.characterization.test.ts`

**Comportamentos a travar:**
- `visibility` aceita `'PUBLIC'` e `'PLAYERS_ONLY'`; default é `'PLAYERS_ONLY'`.
- `openForAnnotation` existe no estado mas não produz efeito funcional documentado.
- `publicMatchCode` existe no estado mas não está no schema (campo morto).
- `POST /api/matches` cria `Match` com todos os campos atuais.
- `GET /api/matches` retorna apenas partidas do `createdByUserId` atual.

*Critério de saída:* `pnpm test:strict` verde; nenhum comportamento novo introduzido.

---

### Fase 1 — Schema e Migration
**Objetivo:** Adicionar os dois novos campos ao schema sem quebrar funcionalidades existentes.

#### 1.1 — `prisma/schema.prisma`
Adicionar ao model `Match`:
```prisma
/// true = este registro é um template de partida pública (pool).
/// Nunca tem PointLog próprio. Apenas metadados.
isPublicTemplate  Boolean   @default(false)

/// FK para o template quando esta Match é uma anotação derivada.
/// null = partida privada normal.
sourceMatchId     String?
sourceMatch       Match?    @relation("MatchAnnotations", fields: [sourceMatchId], references: [id], onDelete: SetNull)
annotations       Match[]   @relation("MatchAnnotations")
```

Adicionar índices:
```prisma
@@index([isPublicTemplate], name: "Match_isPublicTemplate_idx")
@@index([sourceMatchId], name: "Match_sourceMatchId_idx")
```

#### 1.2 — Migration SQL
Arquivo: `prisma/migrations/20261109000000_add_public_match_template/migration.sql`
```sql
ALTER TABLE "Match"
  ADD COLUMN "isPublicTemplate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceMatchId"    TEXT
    REFERENCES "Match"(id) ON DELETE SET NULL;

CREATE INDEX "Match_isPublicTemplate_idx"
  ON "Match"("isPublicTemplate")
  WHERE "isPublicTemplate" = true;

CREATE INDEX "Match_sourceMatchId_idx"
  ON "Match"("sourceMatchId");
```

Comandos:
```bash
pnpm db:migrate
pnpm typecheck
pnpm test:strict
```

*Critério de saída:* Schema sincronizado, `pnpm typecheck` com 0 erros, testes de caracterização verdes.

---

### Fase 2 — Backend: Criação e Derivação
**Objetivo:** Permitir que a API receba criação de templates e geração de anotações derivadas.

#### 2.1 — Schema Zod (`src/schemas/match.ts`)
Adicionar:
```typescript
isPublicTemplate: z.boolean().optional().default(false),
sourceMatchId:    z.string().cuid().optional(),
```
**Refinamentos:**
- Se `isPublicTemplate: true`, `sourceMatchId` deve ser `undefined`.
- Se `sourceMatchId` estiver presente, `isPublicTemplate` deve ser `false`.
- Se `isPublicTemplate: true`, o `createdByUserId` não pode ser menor sem `ConsentRecord` ativo com `purpose: 'DATA'`.

#### 2.2 — Lógica de Criação (`src/services/match-create.logic.ts`)
- **`createPublicTemplate(actor, payload)`**:
  - Valida se o ator não é menor sem consentimento.
  - Persiste `Match` com `isPublicTemplate: true`, `visibility: 'PUBLIC'`.
  - Não cria `MatchAnnotationSession`.
  - Grava `AuditLog` com action `'MATCH_TEMPLATE_CREATED'`.
  - Retorna o template criado.
- **`createAnnotationFromTemplate(actor, templateId)`**:
  - Busca o template (`isPublicTemplate: true`, `deletedAt: null`).
  - Verifica se o ator já tem derivada ativa (`sourceMatchId = templateId AND createdByUserId = actor.id AND deletedAt IS NULL AND state NOT IN ['CANCELLED']`).
    - Se existir: retorna `409 ALREADY_ANNOTATING` com o ID da derivada existente.
  - Copia campos propagáveis do template.
  - Cria nova `Match` com `sourceMatchId: templateId`, `createdByUserId: actor.id`, `state: 'SCHEDULED'`.
  - Grava `AuditLog` com action `'MATCH_ANNOTATION_CREATED'`.
  - Retorna a nova `Match` derivada.

#### 2.3 — Rotas de API
- **`POST /api/matches`** (existente):
  - `isPublicTemplate: true` → invoca `createPublicTemplate`.
  - `sourceMatchId` presente → invoca `createAnnotationFromTemplate`.
  - Sem esses campos → fluxo padrão existente.
- **`GET /api/matches/pool`** (nova):
  - Autenticação com RLS.
  - Query: `Match WHERE isPublicTemplate = true AND deletedAt IS NULL`.
  - Paginação: cursor + limit (máx. 50).
  - Ordenação: `scheduledAt DESC NULLS LAST, createdAt DESC`.
  - DTO: `id`, `player1`, `player2`, `format`, `matchType`, `sportType`, `courtType`, `scheduledAt`, `tournamentName`, `clubName`, `category`, `round`, `ctId`, `annotationCount`.
  - Sem filtro de CT (pool global).
- **`POST /api/matches/pool/[templateId]/annotate`** (nova):
  - Autenticação obrigatória.
  - Executa `createAnnotationFromTemplate(actor, templateId)`.
  - Retorno 201: `{ matchId: string }`.
  - Retorno 409 se já existir anotação ativa para o usuário.

#### 2.4 — Testes
- `pool-list.test.ts`
- `pool-annotate.test.ts`
- `match-create-template.test.ts`

*Critério de saída:* `pnpm test:strict` verde, `pnpm typecheck` 0 erros, conformidade R-03.

---

### Fase 3 — Backend: Edição e Propagação
**Objetivo:** Propagar atualizações de metadados do template para derivadas ativas.

#### 3.1 — Campos Propagáveis
Arquivo: `src/services/match-template-propagation.logic.ts`
```typescript
export const PROPAGABLE_FIELDS = [
  'player1Id', 'player2Id', 'player1PartnerId', 'player2PartnerId',
  'format', 'courtType', 'sportType', 'matchType',
  'scheduledAt', 'tournamentName', 'clubName', 'category',
  'round', 'venueClubId', 'temperature', 'humidity', 'details',
] as const;
```
*Campos não propagáveis:* `createdByUserId`, `ctId`, `isPublicTemplate`, `state`, `scoreState`, `winnerId`, `startedAt`, `finishedAt`, `deletedAt`.

#### 3.2 — Serviço de Propagação
- `propagateTemplateUpdate(templateId, updatedFields, tx)`:
  - Filtra para manter somente `PROPAGABLE_FIELDS`.
  - Se nenhum campo propagável mudou: no-op.
  - Executa em transação:
    ```typescript
    await tx.match.updateMany({
      where: {
        sourceMatchId: templateId,
        state: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      data: pick(updatedFields, PROPAGABLE_FIELDS),
    });
    ```
  - Derivadas em `FINISHED` ou `CANCELLED` permanecem intocadas.

#### 3.3 — Rota de Edição (`PATCH /api/matches/[id]`)
- Valida `actor.id === match.createdByUserId`.
- Se `match.isPublicTemplate: true`: executa `propagateTemplateUpdate`.

#### 3.4 — Encerramento do Template (`DELETE /api/matches/[id]/template`)
- Somente o `createdByUserId` pode encerrar.
- Soft-delete: `deletedAt = now()`, `deletedBy = actor.id`.
- Derivadas não são afetadas.
- Template sai do pool (`GET /api/matches/pool` filtra `deletedAt IS NULL`).

#### 3.5 — Testes
- `match-template-propagation.test.ts`
- `match-template-close.test.ts`

*Critério de saída:* `pnpm test:strict` verde, conformidade R-03.

---

### Fase 4 — Backend: Visibilidade de Anotações por Perfil
**Objetivo:** Garantir isolamento e regras de visibilidade adequadas em `GET /api/matches`.

#### 4.1 — Regras de Visibilidade
- **ANOTADOR / TREINADOR:**
  `Match WHERE createdByUserId = self.id` (partidas privadas próprias + derivadas próprias).
- **GESTOR DO CT:**
  `Match WHERE (createdByUserId = self.id OR (sourceMatchId IS NOT NULL AND createdByUserId IN membros_ativos_do_CT))`.
- **SUPORTE / ADMIN:**
  Sem restrição de `createdByUserId`.

#### 4.2 — Ajustes
- Ajustar `listMatches` (ou `matchService.list`) para aplicar escopo conforme `actor.role` e `actor.ctId` (ajuda a sanar a dívida TD-058).

#### 4.3 — Testes
- `match-visibility.test.ts`

*Critério de saída:* `pnpm test:strict` verde.

---

### Fase 5 — Frontend: Payload e Formulário
**Objetivo:** Permitir configurar e emitir templates a partir do formulário de criação de partida.

#### 5.1 — `useNewMatchState.ts`
- Adicionar estado: `const [isPublicTemplate, setIsPublicTemplate] = useState(false);`.
- Expor no retorno. Deprecar o envio de `openForAnnotation`.

#### 5.2 — `build-match-payload.logic.ts`
- Retornar `isPublicTemplate: fields.isPublicTemplate ?? false`.

#### 5.3 — Interface de Visibilidade (`MatchDetailsSection.tsx`)
```text
[ Visibilidade da Partida ]
  ○ Privada — só você anota; ninguém mais encontra esta partida
  ● Pública — aparece no pool público; qualquer usuário pode anotar a própria versão
```
- Ao marcar "Pública": `setIsPublicTemplate(true)` e `setVisibility('PUBLIC')`.
- Extrair subcomponente se exceder 100 linhas (R-03).

#### 5.4 — Testes
- Atualizar `MatchDetailsSection.characterization.test.tsx`.

*Critério de saída:* `pnpm typecheck` 0 erros, `pnpm test:strict` verde, R-03 respeitado.

---

### Fase 6 — Frontend: Tela de Pool de Partidas Públicas
**Objetivo:** Tela `/partidas-publicas` com listagem e ação "Anotar esta partida".

#### 6.1 — Rota e Página (`src/app/partidas-publicas/page.tsx`)
- Client component estruturado com `DashboardChrome`.
- Hook `usePublicMatchPool` (≤ 100L) com paginação e busca.

#### 6.2 — Card de Partida Pública (`public-match-card.tsx`)
- Exibição de atletas, formato, quadra, esporte, data/hora, torneio, clube de origem e contagem de anotadores.
- Botão **[Anotar esta partida]**:
  - Chama `POST /api/matches/pool/[templateId]/annotate`.
  - Se 201: redireciona para `/match/[matchId]/scoring`.
  - Se 409: toast explicativo + botão "Continuar anotação".

#### 6.3 — Menu e Middleware
- Adicionar link em `src/core/access/menu-items.ts` (`📡 Partidas Públicas`).
- Proteger rota em `src/middleware.ts`.

#### 6.4 — Testes
- `usePublicMatchPool.test.ts`
- `public-match-card.test.tsx`
- `menu.test.ts`

*Critério de saída:* `pnpm test:strict` e `pnpm test:design` verdes, R-03 respeitado.

---

### Fase 7 — Frontend: Painel do Gestor
**Objetivo:** Gestor do CT acompanha anotações dos membros agrupadas por template.

#### 7.1 — Seção de Partidas no Painel do Gestor
- Visualização agrupada por template (um cartaz + lista de derivadas de membros do CT).
- Filtro por membro anotador.
- Query com escopo CT: `GET /api/matches?scope=ct`.

#### 7.2 — Testes
- `gestor-match-list.test.ts`

*Critério de saída:* `pnpm test:strict` verde, R-03 respeitado.

---

### Fase 8 — Validação Final S1
- `pnpm typecheck` (0 erros)
- `pnpm lint` (0 erros, 0 avisos)
- `pnpm test:strict`
- `pnpm test:coverage` (cobertura mantida)
- `pnpm test:design`
- `pnpm spec:validate`
- `pnpm check:r03`
- E2E: `08-public-match-pool.spec.ts`

---

## 3. S2 — Nickname de Atleta no Pool Público

### Visão Geral da Modelagem
```text
Player
  ├── nickname: String? @unique           ← Escolhido pelo atleta
  ├── poolVisible: Boolean @default(false) ← Opt-in explícito
  └── poolVisibleSince: DateTime?         ← Timestamp de auditoria da liberação

ConsentPurpose (enum)
  └── + POOL_VISIBILITY                   ← Novo valor
```

---

### Fase 0 — Characterization
**Objetivo:** Travar comportamento atual de busca e criação de atletas.

**Arquivos:**
- `src/app/api/players/pool/route.ts` → `players-pool.characterization.test.ts`
- `src/core/access/pool.ts` → `pool.characterization.test.ts`
- `src/services/player-create.logic.ts` → `player-create.characterization.test.ts`

*Critério de saída:* `pnpm test:strict` verde sem mudanças.

---

### Fase 1 — Schema e Migration

#### 1.1 — `prisma/schema.prisma`
Adicionar ao model `Player`:
```prisma
/// Apelido legível escolhido pelo próprio atleta (único globalmente no pool).
nickname          String?   @unique
/// true = aparece nas buscas do pool público. Opt-in explícito; default oculto.
poolVisible       Boolean   @default(false)
/// Quando o atleta (ou responsável) autorizou a visibilidade no pool.
poolVisibleSince  DateTime?
```

Adicionar ao enum `ConsentPurpose`:
```prisma
enum ConsentPurpose {
  DATA
  BROADCAST
  POOL_VISIBILITY
}
```

Índices:
```prisma
@@index([poolVisible], name: "Player_poolVisible_idx")
@@index([nickname], name: "Player_nickname_idx")
```

#### 1.2 — Migration SQL
Arquivo: `prisma/migrations/20261109010000_add_player_nickname_pool/migration.sql`
```sql
ALTER TABLE "Player"
  ADD COLUMN "nickname"         TEXT UNIQUE,
  ADD COLUMN "poolVisible"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "poolVisibleSince" TIMESTAMPTZ;

ALTER TYPE "ConsentPurpose" ADD VALUE 'POOL_VISIBILITY';

CREATE INDEX "Player_poolVisible_idx"
  ON "Player"("poolVisible")
  WHERE "poolVisible" = true;
```

*Critério de saída:* `pnpm db:migrate` executado, `pnpm typecheck` 0 erros.

---

### Fase 2 — Backend: Validação Pura de Nickname
**Arquivo:** `src/core/athlete/nickname.ts` (novo, ≤ 100L)
```typescript
export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 30;
export const NICKNAME_REGEX = /^[a-z0-9._-]+$/;

export function validateNickname(raw: string): { valid: boolean; reason?: string } {
  const v = raw.trim().toLowerCase();
  if (v.length < NICKNAME_MIN) return { valid: false, reason: 'muito_curto' };
  if (v.length > NICKNAME_MAX) return { valid: false, reason: 'muito_longo' };
  if (!NICKNAME_REGEX.test(v))  return { valid: false, reason: 'caracteres_invalidos' };
  return { valid: true };
}

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}
```

**Schema Zod (`src/schemas/player.ts`):**
```typescript
nickname:    z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/).optional(),
poolVisible: z.boolean().optional(),
```

**Testes:** `nickname.test.ts` (regras de validação, limites e normalização).

---

### Fase 3 — Backend: Ativação de Visibilidade no Pool
**Serviço:** `src/services/player-pool-visibility.logic.ts` (novo, ≤ 100L)
- **Para `visible: true`**:
  - Verifica se o atleta é maior de idade via `birthDate`.
    - Se maior: autoriza diretamente.
    - Se menor: verifica existência de `ConsentRecord` com `purpose = 'POOL_VISIBILITY'` e `revokedAt IS NULL`.
      - Sem consentimento: retorna `403 CONSENT_REQUIRED`.
      - Com consentimento: autoriza.
  - Persiste `poolVisible: true` e `poolVisibleSince: now()`.
  - Grava `AuditLog` (`PLAYER_POOL_VISIBILITY_ENABLED`).
- **Para `visible: false`**:
  - Persiste `poolVisible: false` e `poolVisibleSince: null`.
  - Grava `AuditLog` (`PLAYER_POOL_VISIBILITY_DISABLED`).

**Rota:** `PATCH /api/players/[id]/pool-visibility`
- Apenas o próprio usuário associado ao atleta ou ADMIN/SUPORTE pode acionar.

**Testes:** `player-pool-visibility.test.ts`.

---

### Fase 4 — Backend: Ajuste no Pool de Busca de Atletas
- `src/services/player-service-pool.logic.ts`: incluir `nickname` no DTO de retorno de `listPoolPlayers`.
- `src/core/access/pool.ts`: atualizar `toPoolPlayerView` para expor `nickname: player.nickname ?? null`.
- Atualizar testes de caracterização correspondentes.

---

### Fase 5 — Backend: Criação e Edição de Atleta
- `src/services/player-create.logic.ts`: aceitar `nickname` opcional, normalizar antes de persistir, tratar P2002 retornando `409 NICKNAME_TAKEN`.
- `PATCH /api/players/[id]`: incluir `nickname` com o mesmo tratamento de duplicidade.
- Testes: `player-create-nickname.test.ts` e `player-edit-nickname.test.ts`.

---

### Fase 6 — Frontend: Configuração de Perfil Público e Nickname
- **Tela de Dados Pessoais (`/dados-pessoais`):**
  - Campo de texto para apelido público (`nickname`) com validação.
  - Toggle de "Visível no pool de atletas" (default inativo).
  - Alerta para menores: aviso de necessidade de aprovação do responsável.
- **Hook `useProfilePublic` (≤ 100L):**
  - Gerencia alteração de apelido e toggle de visibilidade.
  - Trata erros 409 (em uso) e 403 (consentimento obrigatório).
- **Modal de Cadastro de Atleta (`NewAthleteModal`):**
  - Campo opcional "Apelido (nickname)" com texto explicativo.
- **Exibição do Nickname no Pool de Seleção de Atletas:**
  - `athlete-dropdown-panel.tsx`: exibir `@nickname` quando disponível.
- **Testes:** `useProfilePublic.test.ts`, `NewAthleteModal.test.tsx`, `athlete-dropdown-panel.test.tsx`.

---

### Fase 7 — Validação Final S2
- Gates completos: `typecheck`, `lint`, `test:strict`, `test:coverage`, `test:design`, `check:r03`.

---

## 4. Novas Entradas para TASKS.md

### A0.13 — Pool de Partidas Públicas (S1) 🔴
| Fase | Descrição | Critério de Saída |
|---|---|---|
| **0** | Characterization: matches route, useNewMatchState, buildMatchPayload, matchService | `test:strict` verde sem mudanças |
| **1** | Schema: `isPublicTemplate` + `sourceMatchId` + migration | `typecheck` 0 erros; migration OK |
| **2** | Backend: `createPublicTemplate` + `createAnnotationFromTemplate` + `GET pool` + `POST annotate` | `test:strict` verde; R-03 OK |
| **3** | Backend: `propagateTemplateUpdate` + `PATCH template` + `DELETE template` (soft) | `test:strict` verde |
| **4** | Backend: visibilidade por perfil (resolve TD-058 parcialmente) | `test:strict` verde |
| **5** | Frontend: `isPublicTemplate` no form + toggle de visibilidade | `typecheck`; R-03 OK |
| **6** | Frontend: `/partidas-publicas` + card + ação Anotar + menu | `test:strict`; `test:design` |
| **7** | Frontend: painel gestor — anotações de membros por template | `test:strict` verde |
| **8** | Validação final + E2E `08-public-match-pool.spec.ts` | Todos os gates verdes |

### A0.14 — Nickname de Atleta no Pool (S2) 🔴
*Dependência:* A0.8 (LGPD) para o fluxo de consentimento de menores; fluxo de maiores de idade implementado primeiro.
| Fase | Descrição | Critério de Saída |
|---|---|---|
| **0** | Characterization: players/pool route, pool.ts, player-create.logic | `test:strict` verde |
| **1** | Schema: `nickname` + `poolVisible` + `poolVisibleSince` + `POOL_VISIBILITY` enum | Migration OK; `typecheck` 0 erros |
| **2** | Backend: `validateNickname` + `normalizeNickname` (core puro) | `test:strict` verde |
| **3** | Backend: `setPoolVisibility` + `PATCH pool-visibility` (maior de idade; menor = 403) | `test:strict` verde |
| **4** | Backend: ajuste `listPoolPlayers` + `toPoolPlayerView` com nickname | `test:strict` verde |
| **5** | Backend: nickname em `createPlayer` + `PATCH player` (P2002 → 409) | `test:strict` verde |
| **6** | Frontend: seção Perfil Público em `/dados-pessoais` + hook + modal cadastro | `test:strict`; R-03 OK |
| **7** | Validação final | Todos os gates verdes |
| **—** | Fase de menores (bloqueada até conclusão de A0.8) | Depende de `GuardianLink` + `ConsentRecord` UI |

---

## 5. Ordem de Execução Recomendada

```text
S1-F0 → S1-F1 → S2-F0 → S2-F1   (Characterization + Schemas/Migrations)
    ↓
S1-F2 → S1-F3 → S1-F4            (Backend S1 completo)
    ↓
S2-F2 → S2-F3 → S2-F4 → S2-F5   (Backend S2 completo)
    ↓
S1-F5 → S1-F6 → S1-F7            (Frontend S1 completo)
    ↓
S2-F6                            (Frontend S2)
    ↓
S1-F8 → S2-F7                    (Validação final e gates de qualidade)
```

