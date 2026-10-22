# PLANO DE IMPLEMENTAÇÃO — Jogo em Duplas (RKT / bkpRKT)

> Documento para um agente de IA implementar a funcionalidade. Data: 2026-10-21.
> Escopo: **nova partida**, **/scoring**, **editar placar**, **timeline** (+ relatório e dashboard como consequência).
> Leia antes: `AGENTS.md` → `docs/RULES.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/TASKS.md`, `docs/MEMORY.md`.
> A pasta `graft/` é apenas uma skill (cópias `.md` dos fontes): **não ler como fonte, não editar**.
> Itens marcados **VERIFICAR** não foram confirmados no código durante o planejamento: confirme antes de agir.

---

## 0. Como trabalhar (regras do projeto que valem aqui)

1. **Characterization-First** (RULES §7): antes de alterar um módulo legado, escreva/rode testes `*.characterization.test.ts` que fixem o comportamento atual. Comportamento estranho vira `[TD-XXX]` em `docs/TASKS.md`, sem corrigir fora de escopo.
2. **Baby steps**: mudanças pequenas, `pnpm typecheck` + testes do módulo a cada passo. Ao fim de cada fase: `pnpm test:strict` (typecheck + no-skip + Jest `--runInBand`). Fases de UI: também `pnpm test:design` e `pnpm test:components`. Fim do projeto: `pnpm test:coverage`, `pnpm spec:validate`, `pnpm lint`, e2e (`pnpm test:e2e`).
3. **Testes pulados são proibidos** (`scripts/check-no-skipped-tests.mjs`). Testes que mexem em timers, IndexedDB, EventSource etc. restauram o recurso no próprio escopo.
4. **Núcleo puro** (`src/core/**`): sem I/O, sem React/Next/Prisma. Toda regra de duplas nova mora em `src/core/scoring/doubles.ts` (funções puras) e é testada isoladamente.
5. **Compatibilidade total com partidas de simples**: todo campo novo é opcional; partidas existentes e seus testes não podem mudar de comportamento. Os testes atuais (inclusive `*.characterization.test.*`) devem continuar verdes sem edição, salvo ajuste de assinatura estritamente necessário.
6. **UI**: usar tokens do Telemetry Design System (`telemetry-*`). Classes genéricas `bg-gray-*`, `bg-sky-*`, `bg-emerald-*` são proibidas em páginas-chave (testado por `test:design`). Acessibilidade: `jsx-a11y` em `error`; todo botão novo com `aria-label`/texto.
7. Imports absolutos `@/…`. `strict`, `noUnusedLocals`, `noUnusedParameters` ligados.
8. Documentar ao final: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/glossario.md`, `docs/TASKS.md`, `docs/MEMORY.md`.

---

## 1. Decisões já tomadas (não reabrir)

| # | Decisão |
|---|---|
| D1 | **Modelagem com colunas de parceiro** em `Match` (não criar entidade `Team`). |
| D2 | `player1`/`player2` passam a significar **lado (dupla)**. O titular da dupla é `player1Id`/`player2Id`; o parceiro vai em `player1PartnerId`/`player2PartnerId`. O engine continua pensando em dois lados. |
| D3 | `initialServerId` **continua sendo** `player1Id` ou `player2Id` (identifica a **dupla** que saca primeiro), nunca o parceiro. Evita quebrar os ≥7 pontos que fazem `initialServerId === player2Id ? 'player2' : 'player1'`. |
| D4 | **"Quem bateu o golpe" (`hitterId`) entra na v1**, opcional (nunca trava a anotação). |
| D5 | **Lado de devolução entra na v1**: quem recebe na quadra de iguais / vantagem, por dupla. |
| D6 | **Troca da ordem de saque/devolução entre sets**: via **Editar Placar** E via **prompt ao fim de cada set**. Liberdade total ao usuário (cada torneio adapta a regra): validar só que os ids pertencem à dupla. |
| D7 | **Servidor é a fonte de verdade dos campos derivados** (membro que saca, devolvedor, quadra). O cliente envia intenção. |
| D8 | **Fase A (endurecer a gravação) vem antes de qualquer feature de duplas** e vale também para simples. |
| D9 | Formatos de jogo existentes (`BEST_OF_3`, `…NO_AD`, `MATCH_TB_10` etc.) servem para duplas sem mudança de regra de placar. |

---

## 2. Estado atual relevante (levantado no código)

### 2.1 Fluxo de gravação de um ponto
1. `src/hooks/useScoringHandlers.point-processor.service.ts` → `applyPoint(flow)`: aplica no `ScoringEngine` local (otimista), `++pointSequenceRef`, gera `clientEventId`, chama `pointSync.syncPointToServer`.
2. `src/hooks/useScoringHandlers.point-sync.ts` → `buildPointPayload` copia **uma lista fixa de campos** (`winnerId, type, serverId, timestamp, sequenceNumber, clientEventId, rallyDetails, rallyLength, isFirstServe, isSecondServe, firstFaultDetail`). Campo fora da lista é descartado em silêncio.
3. `src/app/api/matches/[id]/point/route.ts` (+ `route.logic.ts`): em **uma transação**: dedup por `clientEventId` → checa `MATCH_IN_PROGRESS` → valida ACE/DF (`winnerId` vs `serverId`) → `sequenceNumber` (409 `SEQUENCE_CONFLICT`) → `restoreEngineFromMatch` → `engine.applyPoint` → `tx.match.update({ where:{id, version}, data:{ scoreState:{state, history: []}, version+1 }})` → `tx.pointLog.create`. O snapshot do caminho quente persiste `history: []` (performance). O `serverId` do cliente só é auditado em "shadow mode" (log, não bloqueia).
4. Falha online: re-sync (`fetchMatch(true)`) + 2ª tentativa; se falhar, `queuePointForOffline(enqueue, flow)` → IndexedDB (`src/hooks/useOfflineSync.ts`, `use-offline-sync.logic.ts`: `createPointRequest` reenvia `{...payload, sequenceNumber}`).
5. **Undo**: `src/hooks/useScoringHandlers.undo-redo.service.ts` → engine local `undoLastPoint()` → `PATCH /api/matches/[id]/state` com o **estado inteiro** + `voidPointLogId`/`isUndo`; `transitionMatchState` (`src/services/matchService.ts`) anula o `PointLog` (`voidedAt`) na mesma transação.
6. **Editar placar**: `useSessionManager.edit-score.ts` → `buildNewScoringState` (`useSessionManager.state-builder.ts`) → `persistState(..., {isManualScoreEdit:true})` → `PATCH /state`; backend grava snapshot em `MatchScoreEdit` (`recordScoreEditSegment`).
7. **Timeline**: `GET /api/matches/[id]/report` (`app/api/matches/[id]/report/route.ts`) **sempre reconstrói por simulação**: `rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId, format, scoreEdits)` (`src/core/scoring/timeline-rebuild*.ts`, `point-log-merge.ts`). Só o `PointLog` (colunas + `annotations`) traz as anotações. O cliente busca isso em `useScoringTimelineSync.ts`.

### 2.2 Construção do engine (9 pontos — todos precisam receber a config de duplas)
`hooks/useSuspendedSession.ts` (3×), `hooks/useScoringHandlers.match-fetch.ts` (3×), `hooks/useScoringHandlers.point-processor.service.ts`, `services/matchValidator.ts` (2×), `app/api/matches/[id]/point/route.logic.ts` (`restoreEngineFromMatch`), `core/scoring/timeline-rebuild.ts`, `core/scoring/engine.ts` (`fromSerialized`).
→ Criar **`buildEngineConfig(match)`** único e substituir todos.

### 2.3 Armadilhas já identificadas
- **zod descarta chaves desconhecidas**: `MatchScoreStateSchema`, `MatchScoreStateEnvelopeSchema` (`src/schemas/match.ts`), `PointFlowInputSchema` (`src/schemas/rally.ts`), `QueuedActionSchema`. Todo campo novo precisa estar lá, **e** em `core/scoring/score-normalizer.ts` e `state-envelope.ts` (VERIFICAR se eles filtram chaves).
- **Duplicação de ponto na fila offline (bug existente, confirmado)**: em `applyPoint`, `clientEventId` é variável separada do `flow`. Quando as 2 tentativas online falham, `queuePointForOffline(enqueue, flow)` enfileira **sem** `clientEventId`, e `enqueue` gera UUID novo. Se a 1ª tentativa tiver gravado e a resposta se perdeu (timeout), o reenvio offline grava de novo.
- `P2025` (lock otimista `where:{id, version}`) — **VERIFICAR** em `reportPointRouteFailure` (`route.logic.ts`) se é tratado; só vi `P2002 → 409`.
- Timeline por simulação **não enxerga** trocas de arranjo entre sets (não são `PointLog`).
- Undo/edição enviam estado inteiro do cliente e o servidor sobrescreve sem validar índices/ids de membros.
- `scripts/audit-server-id.ts`, `scripts/shadow-replay-validator.ts`, `core/scoring/shadow-replay.ts` comparam `serverId` com o lado: precisam virar cientes de duplas.

---

## 3. Modelo de domínio de duplas

### 3.1 Tipos (em `src/core/scoring/types.ts` e `doubles.ts`)
```ts
type Side = 'player1' | 'player2';

interface DoublesArrangement {                 // arranjo vigente (vive no ScoringState)
  serveOrder: Record<Side, [string, string]>;  // ids dos membros; índice 0 saca primeiro naquela fase
  serveIndex: Record<Side, 0 | 1>;             // quem da dupla saca no PRÓXIMO game de serviço dela
  receiveDeuce: Record<Side, string>;          // id do membro que recebe na quadra de IGUAIS (o outro, na de VANTAGEM)
}

interface DoublesConfig {                      // imutável, vem do Match
  members: Record<Side, [string, string]>;     // [titularId, parceiroId]
  initial: { serveOrder: Record<Side,[string,string]>; receiveDeuce: Record<Side,string> };
}
ScoringEngineConfig.doubles?: DoublesConfig;
ScoringState.doubles?: DoublesArrangement;     // ausente em simples
PointDetails += { serverId /*membro*/, receiverId?, courtSide?: 'deuce'|'ad', hitterId? }
PointFlow     += { receiverId?: string /*override só no ponto decisivo do no-ad*/, hitterId?: string }
TimelinePoint += { serverId?, receiverId?, courtSide?, hitterId? }
```
O estado é **autocontido**: trocar a ordem entre sets = reescrever `state.doubles`.

### 3.2 Funções puras (`src/core/scoring/doubles.ts`) — escrever e testar primeiro
- `sideOfPlayer(config, id): Side | null` (aceita titular **ou** parceiro).
- `membersOf(config, side)`, `otherMember(config, side, id)`.
- `courtSide(state): 'deuce' | 'ad'` — pontos já jogados no game (ou no tiebreak/MT): par → `deuce`, ímpar → `ad`. **VERIFICAR** como `currentGame.player1/player2` representa pontos em deuce/vantagem (`game-processing.ts`, `point.logic.ts`) para obter o total real de pontos jogados; fixar por characterization test.
- `getServingMemberId(state, config)`:
  - game normal: `state.doubles.serveOrder[state.server][state.doubles.serveIndex[state.server]]`.
  - **tiebreak e match tiebreak** (função pura de `t` = soma dos pontos do tiebreak já jogados; `serveIndex` **não muda durante o tiebreak**): bloco `b = floor((t+1)/2)`; `s0` (quem abriu o TB) = `b` par ? `state.server` : lado oposto; lado do bloco = `s0` se `b` par, senão o oposto; membro = `serveIndex[s0] ^ ((b/2) % 2)` para `s0`, e `serveIndex[s1] ^ (((b-1)/2) % 2)` para `s1`.
- `advanceServeIndex(state, servedSide)`: ao **fim de cada game regular**, `serveIndex[servedSide] ^= 1`. Ao **fim de tiebreak/MT**, `serveIndex[s0] ^= 1` (o TB conta como 1 game sacado por `s0`; `s1` inalterado).
- `getReceiverMemberId(state, config, override?)`: lado receptor = oposto de `state.server`; `courtSide==='deuce'` → `receiveDeuce[r]`, senão o outro membro de `r`. `override` só é aceito se pertencer ao lado receptor **e** o ponto for o decisivo do no-ad.
- `isNoAdDecidingPoint(state, format)` — **VERIFICAR** representação no engine (formatos `*_NO_AD`).
- `deriveArrangementFromGames(totalGames, initial)` — padrão para o modal de edição: o lado que abriu saca `ceil(G/2)` games, o outro `floor(G/2)` (TB = 1 game); `serveIndex[s] = (initialIdx[s] + gamesServedBy[s]) % 2`. **Só sugestão**: se há `state.doubles` válido, ele manda.
- `validateDoublesArrangement(config, arr)`: ids pertencem à dupla certa, índices 0/1, `receiveDeuce` é membro do lado.

### 3.3 Integração no engine
- `engine.state.ts#createInitialState`: se `config.doubles`, `state.doubles = {serveOrder: initial.serveOrder, serveIndex: {player1:0, player2:0}, receiveDeuce: initial.receiveDeuce}`.
- `engine.ts#applyPoint`: **antes** de aplicar, calcular `serverId`, `receiverId`, `courtSide` (com `flow.receiverId` como override) e gravá-los no `PointDetails` (entram no `history.stateBefore/point`, logo o **undo funciona sem código extra**). Se `config.doubles`: ACE/DF forçam `hitterId = serverId`.
- `resolveWinner`: usar `sideOfPlayer` (aceita titular ou parceiro) em vez de comparar só com `player1Id/player2Id`.
- `game-processing.ts`, `tiebreak.ts`, `match-tiebreak.ts`, `set-completion.ts`: chamar `advanceServeIndex` onde hoje `state.server` é invertido. **Não** alterar a lógica de lado/placar existente.
- `fromSerialized`/`loadState`/`normalizeScoreState`: preservar `state.doubles`.
- Todo ponto novo em simples segue idêntico (campos ausentes).

---

## 4. Banco de dados (Prisma)

`prisma/schema.prisma` + nova migração `prisma/migrations/2026102xxxxxxx_add_doubles/migration.sql` (aditiva):
```prisma
enum MatchType { SINGLES DOUBLES }
model Match {
  matchType        MatchType @default(SINGLES)
  player1PartnerId String?
  player2PartnerId String?
  player1Partner   Player? @relation("Player1Partner", fields:[player1PartnerId], references:[id])
  player2Partner   Player? @relation("Player2Partner", fields:[player2PartnerId], references:[id])
  doublesSetup     Json?   // { version:1, serveOrder, receiveDeuce, changes:[{afterSet, serveOrder, receiveDeuce, at}] }
}
model Player { matchesAsPlayer1Partner Match[] @relation("Player1Partner")
               matchesAsPlayer2Partner Match[] @relation("Player2Partner") }
```
- `PointLog` **não muda de schema**: `serverId` = membro que sacou; `winnerId` = titular da dupla vencedora; `receiverId`, `courtSide`, `hitterId` vão em `annotations` (JSON).
- `doublesSetup` guarda o arranjo **inicial** (definido ao iniciar a partida) e o histórico `changes[]` (auditoria/fallback de reconstrução).
- **VERIFICAR** `prisma/legacy_sql/add_rls_policies.sql` e `src/lib/rls-context.ts`: confirmar que colunas novas não exigem política nova.
- `prisma/seed.ts`: adicionar 1 partida de duplas de exemplo.
- `playerService`: exclusão/uso de atleta deve considerar as relações de parceiro.

---

## 5. Contratos / schemas (`src/schemas/*`)

- `CreateMatchInputSchema`: `matchType` (default `SINGLES`), `player1PartnerId`, `player2PartnerId`. Refine: `DOUBLES` ⇒ 4 ids distintos e obrigatórios; `SINGLES` ⇒ sem parceiros.
- `MatchStateInputSchema`: `doublesSetup` opcional; **obrigatório** ao ir para `IN_PROGRESS` em partida `DOUBLES`. `initialServerId` deve ser `player1Id` ou `player2Id`.
- `MatchScoreStateSchema` / Envelope: adicionar `doubles` (objeto opcional) — **item crítico** (senão é descartado em todo round-trip).
- `PointFlowInputSchema`: `hitterId?`, `receiverId?` (top-level e em `annotations`); `QueuedActionSchema` herda.
- `MatchSchema`/`PlayerSchema`: expor `matchType`, `player1Partner`, `player2Partner`.
- Novo `ArrangementInputSchema`: `{ afterSet:int≥0, serveOrder, receiveDeuce, version:int }`.
- `src/schemas/contracts.ts`: reexportar tudo.

---

## 6. FASE A — Endurecer a gravação (vale para simples; fazer ANTES das duplas)

Objetivo: fechar defeitos de persistência que duplas amplificam. Cada item com teste de regressão.

**A1. `clientEventId` preservado na fila offline**
- `useScoringHandlers.point-processor.service.ts`: incluir `clientEventId` no que vai para `queuePointForOffline` (ex.: `{...flow, clientEventId}`); `useOfflineSync.enqueue` já respeita `action.payload.clientEventId`.
- Teste (`__tests__/useScoringHandlers.point-processor.test.ts` ou novo `.regression.test.ts`): timeout na 1ª tentativa, falha na 2ª, ponto enfileirado **com o mesmo** `clientEventId`; reenvio offline com servidor que já gravou ⇒ **exatamente 1** `PointLog`.

**A2. Contrato único de payload**
- Criar `src/core/scoring/point-payload.ts` (ou em `schemas`) com a lista de campos do ponto; `buildPointPayload`, `createPointRequest` e `PointFlowInputSchema` derivam dela.
- Teste de contrato: para cada chave de `PointFlow`, existe em payload, schema e `PointLog` (colunas ou `annotations`). Quebra o build se alguém adicionar campo e esquecer um elo.

**A3. Lock otimista**
- Confirmar tratamento de `P2025` em `reportPointRouteFailure`; mapear para **409** (`VERSION_CONFLICT`) com teste. Fazer o cliente (`respondWithConflict`) tratar sem perder o ponto.

**A4. Teste de round-trip de gravação**
- Novo teste de integração: grava ponto com `rallyDetails`, `firstFaultDetail`, nota, `clientEventId` ⇒ lê via `/report`, `point-logs-meta` e `GET /matches/[id]`; nada some. Rodar também após undo e após edição de placar.

**A5. Auditoria**
- Estender `scripts/audit-server-id.ts` e `src/core/scoring/__tests__/audit-server-id.test.ts` para o conceito "serverId = membro" (por ora só simples; duplas na Fase C).

Critério de aceite da Fase A: `pnpm test:strict` verde; nenhuma mudança de comportamento observável em simples.

---

## 7. FASE B — Núcleo puro (`src/core/scoring`)

1. Characterization tests do engine atual para os pontos onde `state.server` muda (game, tiebreak, MT, fim de set, formatos NO_AD / 2v2 / PRO_SET_8). Já existem muitos (`tiebreak-next-set-server.regression.test.ts`, `server-resolution-regression.test.ts`, `engine.fromSerialized.serverId.test.ts`): rodar e usar de base.
2. Implementar `doubles.ts` (seção 3.2) + tipos (3.1).
3. Integrar no engine (3.3).
4. Schemas: `doubles` em `MatchScoreStateSchema`/Envelope + `score-normalizer.ts` + `state-envelope.ts`; teste de round-trip `serialize → normalize → parse` sem perda.
5. `buildEngineConfig(match)` e substituição nos 9 pontos (2.2).
6. `timeline-rebuild*.ts`: aceitar `DoublesConfig`; `simulateScoreFromPointLogs` aplica `doublesSetup.changes[]` nas viradas de set (fallback para linhas sem campos persistidos).

Testes novos (`src/core/scoring/__tests__/doubles.*.test.ts`):
- Rotação por games ao longo de 2+ sets; ordem A1,B1,A2,B2.
- Tiebreak de 7 e match tiebreak de 10: sequência `1,2,2,2…`; membro de cada bloco; efeito no 1º game do set seguinte (`serveIndex[s0]` virou, `s1` não).
- `courtSide` em game normal, em deuce/vantagem, no tiebreak.
- Receptor padrão e override só no ponto decisivo no-ad.
- Undo restaura `state.doubles` exato (inclusive através de fim de game, de tiebreak e de set).
- Simples inalterado (property test: mesma sequência de pontos ⇒ mesmo estado com e sem `doubles` ausente).
- Rodar `pnpm test:mutation` no diff do engine (`stryker`: high 80 / low 60 / break 50).

---

## 8. FASE C — Dados e APIs

1. Migração + client Prisma (`pnpm db:push`/migrate no ambiente de teste).
2. `POST /api/matches` e `matchService.create` (`match-service-create.logic.ts`): persistir `matchType`/parceiros; `buildCreateDefaults` inicializa `scoreState` sem `doubles` (o arranjo nasce ao iniciar). `validateCreateMatchPlayers` valida 4 distintos.
3. `PATCH /api/matches/[id]/state` + `transitionMatchState`/`buildTransitionUpdateData` (`match-service-operations.logic.ts` ~L137–160): ao ir para `IN_PROGRESS` em `DOUBLES`, exigir `doublesSetup`, validar com `validateDoublesArrangement`, gravar `Match.doublesSetup` e `scoreState.state.doubles` inicial, e `server` pelo lado de `initialServerId`.
4. `matchValidator.ts`: criar `validateDoublesState(state, match)` e chamar em `validateTransitionState` para undo/edição (índices 0/1; ids ∈ membros; `receiveDeuce` ∈ lado). Em simples, não-op.
5. **`POST /api/matches/[id]/point`** (a mudança mais sensível):
   - Em `DOUBLES`: após `restoreEngineFromMatch`, **o servidor calcula** `serverId`, `receiverId`, `courtSide` do estado pré-ponto e grava `serverId` (coluna) e `receiverId/courtSide` (`annotations`). Se o `serverId` do cliente divergir, grava o do servidor e loga warning (substitui o "shadow mode" só nesse caso).
   - Trocar as validações ACE/DF (`winnerId === serverId`) por comparação de **lados** via `sideOfPlayer`.
   - Validar `hitterId` ∈ membros da partida (e `receiverId` ∈ lado receptor, só se ponto decisivo no-ad); ACE/DF forçam `hitterId = serverId`.
   - `buildAnnotationsPayload` passa a incluir `hitterId`, `receiverId`, `courtSide`.
   - `finishData.winnerId` continua `player1Id`/`player2Id` (titular).
   - `validateMatchAnnotatorPermission` e `checkCanModifyMatchState` (state/route.ts) e checagens do report/`isPlayer`: incluir parceiros.
6. **Novo `POST /api/matches/[id]/arrangement`** (`withRLSHandler(..., 'ANNOTATOR', …)`): body `ArrangementInputSchema`. Em **uma transação**: lock por `version`; `validateDoublesArrangement`; atualizar `scoreState.state.doubles`; anexar a `doublesSetup.changes[]` (`afterSet` sobrescreve entrada existente do mesmo set); `version+1`; `emitMatchEvent` (VERIFICAR nomes em `src/lib/match-events.ts`/`useMatchEvents`) para outros dispositivos ressincronizarem.
7. **Undo que cruza virada de set**: no ramo `isUndo` de `transitionMatchState`, remover de `doublesSetup.changes[]` as entradas com `afterSet` ≥ nº de sets concluídos do estado restaurado.
8. **`PATCH /api/matches/[id]/point/[pointId]`** (existe; VERIFICAR o que faz hoje): aceitar `{hitterId?, receiverId?}` fazendo **merge** em `annotations` (nunca sobrescrever `rallyDetails`/`note`), com a mesma validação de membros. Para "preencher quem bateu depois".
9. `GET /api/matches/[id]` e `matchRepository.ts` (selects nas linhas ~48/86): incluir `matchType`, `player1Partner`, `player2Partner` (`{id,name}`) e `doublesSetup`.
10. `/report`: usar `buildEngineConfig`; devolver `matchType`, `members` (nomes dos 4) e os campos novos por ponto; `PointLogRow.annotations` tipado com os campos novos; `pointLogToFlow` repassa `hitterId`/`receiverId`.
11. Estender `scripts/audit-server-id.ts`, `shadow-replay-validator.ts`, `core/scoring/shadow-replay.ts` para duplas (compara membro esperado).

Testes: `route.test`/`real.test` do `/point` com duplas (membro derivado, ACE/DF por lado, hitter inválido ⇒ 400, undo, sequência 409), teste do `/arrangement` (lock, undo remove `changes`), e `matchValidator` para duplas.

---

## 9. FASE D — Nova partida (`src/app/match/new`)

Arquivos: `useNewMatchState.ts`, `components/PlayerSelection.tsx`, `AthleteDropdown.tsx`, `build-match-payload.logic.ts`, `types.ts`, `useNewMatchSelectionActions.ts`, `useNewMatchSubmissionActions.ts`, `new-match-submit.logic.ts`, `offline-match.logic.ts`, `schedule-check.logic.ts`, `components/DuplicateMatchModal.tsx`, `components/ServerSelectionModal.tsx`, `MatchNewModals.tsx`, `start-match.logic.ts`.

1. **Seletor "Simples | Duplas"** (segmented control) em `PlayerSelection`. Em Duplas: 4 slots (Dupla 1: atleta A + B; Dupla 2: C + D). Estado: `matchType`, `selectedP1`, `selectedP1Partner`, `selectedP2`, `selectedP2Partner`.
2. `AthleteDropdown`: `excludedAthlete` passa a `excludedAthletes: Athlete[]` (todos os já escolhidos). Criar atleta novo (`NewAthleteModal`) deve funcionar para os 4 slots (`newAthleteFor` aceita `'p1'|'p1b'|'p2'|'p2b'`).
3. Validação do formulário (campos faltantes, `missingFields`): 4 distintos em duplas.
4. `buildMatchPayload`: enviar `matchType`, `player1PartnerId`, `player2PartnerId`.
5. **Checagem de duplicidade** (`schedule-check.logic.ts`, `DuplicateMatchModal`, `matchSuggestionService`, rota `matches`): comparar por conjunto de 4 atletas (duplas) / 2 (simples).
6. **Modal de saque inicial (único, compartilhado)** — extrair de `ServerSelectionModal` um componente reutilizado por: `/match/new` (`useNewMatchSelectionActions.selectServingPlayer`), dashboard (`app/dashboard/use-dashboard-server-start.ts`, `DashboardMatchModals.tsx`, `matchesClient.startMatch`) e `/scoring` (`useScoringHandlers.ts` ~L258). Em simples: 1 passo (como hoje). Em duplas, 4 passos:
   1. Qual dupla saca primeiro?
   2. Quem dessa dupla saca?
   3. Quem da outra dupla saca no 2º game?
   4. Quem recebe na quadra de **iguais** em cada dupla (2 toggles; padrão = quem não saca no 1º game… ou titular; documentar o padrão e deixar editável).
   - Saída: `initialServerId` = titular da dupla que abre; `doublesSetup = { serveOrder, receiveDeuce }`.
7. `startMatch` (`start-match.logic.ts`) e `matchesClient.startMatch`: enviar `doublesSetup`.
8. **Offline**: `createOfflineMatch` / sincronização de criação precisam carregar `matchType`, parceiros, `doublesSetup`.
9. Rótulos: helper `formatSideLabel(match, side)` em `src/lib` ("Silva / Souza"), usado em todos os lugares abaixo.

Testes: `NewMatchPage.test.tsx` (modo duplas, exclusão de 4 slots), `schedule-check.helpers.test.ts`, `onlineMatchSubmit.conflict.regression.test.ts`, novo teste do modal de 4 passos.

---

## 10. FASE E — /scoring

Arquivos: `app/match/[id]/scoring/*` (`scoring-play-area-players.tsx`, `ScoringPlayArea.tsx`, `scoring-session-modals.tsx`, `useScoringPageDerived.ts`, `useScoringPageState.ts`), `components/scoring/PlayerCard.tsx` + `player-card.*`, `ScoreboardCard.tsx`/`use-scoreboard-card-data.ts`, `ServerEffectModal.tsx` (+ header/body/footer), `ContextBadges.tsx`, `TacticalInsightBanner.tsx`, `PointDetailsModal.tsx`, `point-details-logic.ts`, `hooks/use-scoring-handlers-server.service.ts`, `hooks/useScoringHandlers.serve-actions.service.ts`.

1. **Toque no card = ponto da dupla** (comportamento atual preservado).
2. `PlayerCard`: em duplas, mostrar os 2 nomes; 🎾 no membro que saca; indicador de quem devolve e a quadra (Iguais/Vantagem) no card receptor. Props novas opcionais; simples renderiza igual.
3. `createServerResolutionService`: `getServerId()` devolve **o membro que saca** (`getServingMemberId`); `getWinnerId()` devolve o **titular** da dupla vencedora. Atenção: `getWinnerId` hoje compara `serverId === match.player1.id`; trocar por `sideOfPlayer`.
4. `ScoreboardCard`: `isServingP1/P2` já compara com `currentServer === player1Id`; manter por lado.
5. `ServerEffectModal`/`ContextBadges`: textos com nome da dupla ("Ponto para: Silva/Souza").
6. **Chips "quem bateu"** no `PointDetailsModal` (aparece só em duplas): 2 chips do membro da dupla relevante (winner ⇒ dupla vencedora; erro forçado/não forçado ⇒ dupla que errou). Pré-seleção sugerida: ACE/DF ⇒ sacador; situação `devolucao` ⇒ devolvedor. Totalmente opcional. `confirmPointDetails` repassa `hitterId` no `applyPoint`. Gravado junto do ponto (um único write).
7. **Seletor de devolvedor no ponto decisivo do no-ad**: chip duplo "Devolve: A / B" (pré-selecionado) exibido só nesse ponto; envia `receiverId`.
8. **Prompt ao fim de cada set**: reaproveitar `SetSummaryModal` (VERIFICAR onde/como abre ao fim do set) com seção "Ordem do próximo set" (só duplas): quem saca primeiro em cada dupla e quem recebe na quadra de iguais em cada dupla, pré-preenchidos com a continuação normal, botão "Manter como está". Confirma via `POST /arrangement` (online) ou fila (offline — definir: enfileirar ação `ARRANGEMENT` na mesma fila IndexedDB, mantendo a ordem relativa aos pontos; ou bloquear com aviso quando offline. **Decisão a tomar na Fase E; preferir enfileirar**).
9. `useScoringHandlers.match-fetch.ts` / `useSuspendedSession.ts`: reidratar o engine com `buildEngineConfig` e `state.doubles`.
10. Realtime (`useMatchEvents`): aplicar `scoreState` com `doubles` vindo de outros dispositivos.

Testes: `PlayerCard*.test.tsx`, `ServerEffectModal.test.tsx`, `point-details-logic.test.ts`, `useScoringHandlers*.test.ts` (getServerId/getWinnerId em duplas), `SetSummaryModal.test.tsx`, ActionBar (se afetado).

---

## 11. FASE F — Editar placar

Arquivos: `components/scoring/EditScoreModal.tsx`, `edit-score-*.tsx`, `edit-score-logic.ts`, `edit-score.logic.ts` (`getNextServerAfterSet`), `use-edit-score-modal-*.logic.ts`, `edit-score-modal.types.ts`, `app/match/[id]/scoring/scoring-edit-score-modal.tsx`, `useScoringEditScore.ts`, `hooks/useSessionManager.edit-score.ts`, `useSessionManager.state-builder.ts`.

1. Hoje o modal define só o **lado** que saca (`calculateNextServer`). Em duplas, adicionar seção "Saque e devolução": 
   - qual dupla saca agora (já existe) + **qual membro**;
   - para cada dupla: quem saca no próximo game dela e quem recebe na quadra de iguais.
   - Padrão: `state.doubles` atual; se placar editado mudou a paridade de games, sugerir por `deriveArrangementFromGames`. Usuário pode sobrescrever tudo (D6). Em set em tiebreak/MT, mostrar quem sacou o primeiro ponto.
2. `EditScoreModalProps` ganha `doubles?: { members, arrangement }`; `onConfirm(setResults, server, arrangement?)`.
3. `buildNewScoringState({ ..., doubles })` grava `state.doubles`; `executeScoreEdit` envia via `persistState(... isManualScoreEdit)`; `engine.loadState(newState)` mantém `doubles`.
4. Backend: `validateDoublesState` valida o que vier. `MatchScoreEdit.previousScoreState/newScoreState` (JSON) já carregam `doubles` — só garantir que `recordScoreEditSegment` e `timeline-rebuild` (`engine.loadState(unpacked)`) não o descartam.
5. A edição também registra `doublesSetup.changes[]` (mesma regra do `/arrangement`) para a simulação.
6. Manter todas as validações de placar existentes intactas (há >40 testes de caracterização desse modal: **não editar os existentes**; criar arquivos `*.doubles.test.tsx`).

Testes: `edit-score-logic*.test.ts` (variantes de duplas), `useSessionManager.state-builder*.test.ts`, `EditScoreModal.doubles.test.tsx`, regressão: editar placar no meio do set 2 e conferir a timeline do `/report`.

---

## 12. FASE G — Timeline, relatório e dashboard

**Timeline** (`components/scoring/timeline-*.tsx|ts`, `MatchTimelineView.tsx`, `ScoringTimelineView.tsx`):
1. `TimelinePoint` + `mergeWithPointLog` + `PointLogRow` + `buildPointDetailsFromLog` incluem `serverId`, `receiverId`, `courtSide`, `hitterId` (**PointLog persistido é a verdade de exibição**; simulação só para placar e fallback de linhas antigas).
2. `timeline-point-row.tsx` / `timeline-row-cells.tsx` (`IdentityCells`): coluna "Sacador" mostra as **iniciais do membro** (cor do lado); "Vencedor" mostra a dupla (ex.: "S/M"). Em duplas, colunas/badges novos: Devolvedor, Quadra (Iguais/Vant.), Autor ("quem bateu"). Em simples, nada muda (testes `MatchTimelineView.columns.test`, `timeline-rows*.test` continuam verdes).
3. `timeline-rows.tsx`, `timeline-game-end-row.tsx`, `timeline-header.tsx`, `timeline-filters.tsx`/`use-timeline-filters.ts`: nomes de dupla; filtro por jogador (membro) em duplas. Break (`timeline-game-end.ts#checkIsBreak`) permanece por **lado**.
4. `timeline-format.ts`: sem mudança de lógica de DF/ACE.
5. Marcador "⏸ Partida interrompida" (`addScoreEditBreaks`) continua; mostrar também trocas de arranjo (`changes[]`) como marcador leve.

**Relatório** (`core/report/*`, `components/report/*`, `app/match/[id]/report`): agregados por **lado** inalterados; novo bloco por **membro** (aces, duplas faltas, winners, erros não forçados, pontos ganhos na devolução por quadra). Cabeçalho com nomes das duplas.

**Dashboard / listas** (`components/dashboard/MatchCard.tsx`, `match-card-*`, `app/dashboard`, `historico`, `partidasanotadas`, `partidasaovivo`, `matches/locate`, `atletas`): usar `formatSideLabel`; `MatchCard` types (`match-card-types.ts`) ganham `matchType` e parceiros. (Locais localizados por busca; **VERIFICAR** cada tela ao implementar.)

---

## 13. FASE H — Regressão, e2e e documentação

1. **E2E (Playwright, `e2e/flows`)**: partida de duplas completa — criar com 4 atletas, escolher saque/devolução (4 passos), marcar pontos com ACE/DF/winner/erro e "quem bateu", ponto decisivo no-ad, undo, fim de set com troca de ordem, editar placar, **queda de rede no meio** (fila offline + reenvio sem duplicar), abrir a timeline e conferir que servidor/devolvedor/autor batem com o que apareceu ao vivo.
2. **Teste de consistência** (extensão de A4): para uma partida de duplas, `PointLog` ⇄ `scoreState` ⇄ timeline ⇄ relatório coerentes (mesma contagem, mesmos sacadores).
3. Rodar: `pnpm typecheck && pnpm lint && pnpm test:strict && pnpm test:design && pnpm test:components && pnpm test:coverage && pnpm spec:validate && pnpm test:e2e`. Cobertura mínima: statements 65 / branches 80 / functions 60 / lines 65.
4. Documentar: PRD (duplas no escopo), ARCHITECTURE (modelo de duplas, `doublesSetup`, `/arrangement`, contrato de ponto), glossário (dupla, titular, membro, quadra de iguais/vantagem, arranjo), TASKS (débitos encontrados), MEMORY (decisões D1–D9).

---

## 14. Padrões adotados nos pontos em aberto (podem ser ajustados pelo usuário)

- Tiebreak: ponto 1 sacado da quadra de **iguais**; a quadra alterna a cada ponto jogado.
- Seletor de devolvedor só no **ponto decisivo do no-ad**; nos demais, devolvedor sempre derivado.
- "Quem bateu" **sempre opcional**; pode ser preenchido depois via `PATCH /point/[pointId]`.
- Padrão do arranjo inicial de devolução: titular recebe na quadra de iguais, editável no modal.
- Troca de arranjo offline: enfileirar (preferido) — decidir na Fase E.

## 15. Fora de escopo (v1)

Duplas mistas com regra de gênero automática; ranking de duplas; posicionamento em quadra além de iguais/vantagem; troca de arranjo **no meio** de um set fora de Editar Placar; migração retroativa de partidas antigas para duplas.

## 16. Riscos principais e mitigação

| Risco | Mitigação |
|---|---|
| Campo novo some em round-trip (zod/normalizer/whitelist) | Contrato único (A2) + teste de round-trip (A4) |
| `initialServerId` com id de parceiro quebra lado | Decisão D3 + `sideOfPlayer` + testes de auditoria |
| Duplicação de ponto offline | A1 + teste de idempotência ponta a ponta |
| Timeline divergente do ao vivo | PointLog como verdade de exibição + `changes[]` + teste de consistência |
| Undo atravessando set com arranjo alterado | Regra do §8.7 + teste |
| Regressão em simples | Campos opcionais, testes existentes intactos, property test de equivalência |
| Cliente envia estado inválido | `validateDoublesState` no servidor |

## 17. Definição de pronto

- Fases A–H concluídas; todos os comandos do §13.3 verdes.
- Partida de simples: comportamento idêntico (suíte existente intacta).
- Partida de duplas: criar → iniciar → pontuar (com autor e devolvedor) → undo → trocar ordem entre sets → editar placar → finalizar → timeline e relatório corretos, também com rede instável.
- Documentação atualizada (§13.4).
