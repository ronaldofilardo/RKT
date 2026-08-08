# RKT — Correções do módulo de Placar (Scoring / Edit Score)

**Data:** 2026-08-07
**Origem:** Demanda do usuário (bkpRKT.zip + 11 itens) e diagnóstico anterior (`INSTRUCOES_CORRECAO_PLACAR.md`).
**Tipo:** Bug fix em módulo de lógica de negócio (engine de pontuação + modal de edição).
**Regime:** Análise e validação do diagnóstico (sem alterar código nesta sessão). Próxima fase: implementação via handoff para `@backend` + `@frontend`.

---

## Sumário executivo

O diagnóstico anterior estava **parcialmente correto**, mas errou a localização da causa raiz dos bugs #4/#5. Após validar o estado real do repo:

- **#4/#5:** a causa raiz NÃO é `completeSetWithTiebreak` em `engine.flow.ts`. O motor ao vivo (`applyPoint` → `processMatchTiebreak` → `completeMatchTiebreak`) já está correto. **A causa real está em `useEditScoreModal.ts`**, cujo `handleConfirm`/`handleAddSet` constroem o payload que descarta `tiebreakScore` dos sets já completos, persistindo estado corrompido (`7-6` sem `tiebreakScore`) — exatamente o formato que o band-aid em `match-card-utils.ts:39-46` detecta.
- **#1:** causa identificada com confiança ebaixo: `ActionBar` recebe `canEdit={false}` **hard-coded** em `src/app/match/[id]/scoring/page.tsx:293`. Botão "✏️" simplesmente nunca é renderizado.
- **#6/#9/#10:** confirma o diagnóstico anterior com linhas exatas.
- **#7/#8:** consequência direta de #4 (não bug isolado) + um early-return suspeito em `canConfirm` que revisar.
- **#11:** já está implementado (`EditableSetsSummary` rende `<input>` chamando `onEditSet`/`onRemoveSet`, conectados a handlers reais). Provavelmente já funciona; validar em runtime.
- **#3:** referência visual confirmada pelo usuário = `ScoreboardCard.tsx` (tela ao vivo). Ajustar `EditableSetsSummary` em `edit-score-summary.tsx` para seguir esse padrão.

A persistência do estado corrompido em produção já existe (testemunhada pelo band-aid em `match-card-utils.ts`), de modo que o fix #4 demanda também **um caminho de migração/normalização unificado** para que o estado persistido possa ser saneado no read-path — não só no fluxo novo.

---

## Arquivos centrais (validados)

| Arquivo | Status | Porquê |
|---|---|---|
| `src/core/scoring/engine.flow.ts` | válido ao vivo | `processMatchTiebreak`/`completeMatchTiebreak` (linhas 95-173) não incrementam games; fluxo ao vivo correto. |
| `src/core/scoring/engine.ts` | válido | roteamento `isMatchTiebreakActive` → MT (linha 96-98) correto. |
| `src/core/scoring/types.ts` | **precisa update** | `SetScore` (linha 45-50) sem campo `isMatchTiebreak?: boolean` — heurística espalhada em 5+ lugares. |
| `src/components/scoring/useEditScoreModal.ts` | **causa raiz de #4/#5** | linhas 84-89, 141-146, 160-165, 289-293, 363 descartam `tiebreakScore` ao reconstruir `_existingCompleted` e ao `handleAddSet`. |
| `src/components/scoring/edit-score-logic.ts` | bug menor | `calculateValidation` (linhas 130-140) duplica heurística `isMatchTiebreakSet` já presente em `useSessionManager.utils.ts`. |
| `src/components/scoring/editScoreHelpers.ts` | OK | `validateStandardSet`/`validateMatchTiebreak`/`getNextServerAfterSet` lógica correta; problema é que recebem dados corrompidos. |
| `src/components/scoring/use-edit-score-calculator.ts` | bug #10 + risco #7/#8 | `showGamePointsAtZero` (108-115) e `canConfirm` (80-104) — early-return suspeito nas linhas 89-90. |
| `src/components/scoring/edit-score-form.tsx` | bug #6/#9UI | linhas 255-311 (Pontos no Game Atual), 143/157 (min), 78-100 (msgs). |
| `src/components/scoring/edit-score-summary.tsx` | bug #3UI | `EditableSetsSummary` estilo claro, destoando do padrão `ScoreboardCard`. |
| `src/components/scoring/ScoreboardCard.tsx` | referência visual #3 | padrão dark + green/purple highlight. |
| `src/components/scoring/EditScoreModal.tsx` | OK | passagens de handlers confirmadas; bug é no hook. |
| `src/components/dashboard/match-card-utils.ts` | **band-aid incompleto** | `normalizeScoreState` (33-48) só cobre `MATCH_TB_10`/`BEST_OF_3_MATCH_TB`, **não `BEST_OF_5` 5º set** (que é o cenatório #4). |
| `src/app/match/[id]/scoring/page.tsx` | bug #1 caso hard-coded | linha 293: `canEdit={false}`. |
| `src/hooks/useSessionManager.utils.ts` | OK | `isMatchTiebreakSet` (144-186) é a versão mais completa — usar como fonte única. |

---

## Bug a bug (após validação em repo)

### #1 — "Ajustar Placar" desabilitado em produção
**Causa raiz CONFIRMADA.**
- `src/app/match/[id]/scoring/page.tsx:293`: `canEdit={false}` hard-coded.
- `src/components/scoring/ActionBar.tsx:104-108`: o botão `✏️` só rende quando `canEdit === true`. Portanto **nunca aparece**.
- Não tem a ver com `isFinished` — `isFinished` desabilita apenas `Ace`/`Out`/`Net`/`Corrigir`/`Refazer` (linhas 51, 84, 89), não o EditScore.
- **Fix:** trocar por `canEdit={!isFinished}` (ou `canEdit={true}` se quiser permitir editar mesmo em partida finalizada para correção retroativa — ver bug #11).
- **Risco:** baixo. Adicionar characterization test para garantir que o botão aparece/aparece disabled quando `isFinished`.

### #4 — 5º set (BO5) tratado como games ao editar para MT
**Causa raiz CONFIRMADA — diverge do diagnóstico anterior.**

Diagnóstico anterior afirmava: `completeSetWithTiebreak` (`engine.flow.ts:327-346`) incrementa `player1/player2` para MT. **Incorreto**: essa função só é chamada para tiebreak normal de fim de set via `processTiebreakPoint` → `completeSetWithTiebreak`. Para MT decisivo o motor usa `processMatchTiebreak` → `completeMatchTiebreak` (linhas 128-173), que **não incrementa games** — apenas atualiza `tiebreakScore`, `setsWon`, `isFinished`, `winner`. Confirmado lendo `engine.ts:96-105` (roteamento `isMatchTiebreakActive` → MT).

**Causa real (validada):**
`src/components/scoring/useEditScoreModal.ts` é responsável por reconstruir o array de `SetEditData` enviado ao backend, e em **4 lugares descarta `tiebreakScore`**:

1. `handleConfirm` linhas 289-293:
   ```ts
   const existingCompleted: SetEditData[] = completedSets.map((cs) => ({
     p1Games: cs.games.player1,
     p2Games: cs.games.player2,
     isPartial: false,
   }));
   ```
   `cs.tiebreakScore` do `CompletedSet` original é ignorado — o array enviado não contém `tiebreakScore`.

2. `handleAddSet` linhas 345-349: cria `SetEditData` sem `tiebreakScore` (hard-coded `isPartial: false`), mesmo em cenários que poderiam exigir (ex.: set 7-6).
   Linha 363 explicitamente `tiebreakScore: null` ao calcular `nextServer`.

3. Effect de init linhas 84-91, 141-148, 160-167: `editableCompletedSets` preserva `tiebreakScore` ( aqui está OK — é local ), mas `existingCompleted` no `handleConfirm` (289-293) **não**.

4. Linha 363: `tiebreakScore: null` passado deliberadamente para `calculateNextServer` em handleAddSet — mas como `calculateNextServer` chega `tiebreakScore` via `EditScoreState`/`completedSets` (que preservam tiebreakScore), o efeito é limitado a esse snapshot.

**Consequência:** persistência do estado corrompido `{player1:7, player2:6, isTiebreak:false, tiebreakScore:null}` (em vez de `{player1:6, player2:6, isTiebreak:true, tiebreakScore:{7,5}}`). Quando relido e exibido, o `ScoreboardCard.tsx` cai no branch `set.isTiebreak && set.tiebreakScore ? tiebreak : games` (linha 84-92) — como `isTiebreak=false`, mostra games → "7-6" em vez de "6(7)-6(5)".

O band-aid em `match-card-utils.ts:39-46` existe para esse estado, mas só atende `MATCH_TB_10`/`BEST_OF_3_MATCH_TB` (linha 34), não cobre **`BEST_OF_5` 5º set** (o cenário #4) — confirma que é um remendo incompleto, indicador claro de dívida técnica.

**Fix recomendado:**
1. `useEditScoreModal.ts:289-293` — propagar `tiebreakScore`:
   ```ts
   const existingCompleted: SetEditData[] = completedSets.map((cs) => ({
     p1Games: cs.games.player1,
     p2Games: cs.games.player2,
     isPartial: false,
     tiebreakScore: cs.tiebreakScore ?? undefined,
   }));
   ```
2. `handleAddSet` (345-349): incluir `tiebreakScore: validation.hasTiebreak && tiebreakComplete ? { p1: tiebreakP1Num, p2: tiebreakP2Num } : undefined`. Confirmar que onConfirm no consumidor `handleEditScore` (`useScoringHandlers` do hook pages) não rejeita `tiebreakScore`.
3. Saneamento read-path: elevar `normalizeScoreState` (hoje só no dashboard) para `src/core/scoring/` e usar no `ScoreboardCard`, `MatchCard` e no init do `useEditScoreModal`, de modo que estado antigo já gravado corrupto seja saneado ao carregar (não pedir migração de banco — P0 read-path). Adicionar `BEST_OF_5` 5º set ao `isMatchTiebreakFormat` em `match-card-utils.ts:34` e `useSessionManager.utils.ts:36` para o saneador cobrir esse formato também.
4. (Residual técnico) Registrar em `docs/TECH_DEBT.md` a dívida do schema: adicionar `isMatchTiebreak?: boolean` a `SetScore` (`types.ts:45-50`) para extinguir a heurística `format+sets.length` duplicada em 5 lugares (`engine.flow.ts:366-370, 463-467`, `editScoreHelpers.ts` getNextServerAfterSet, `useSessionManager.utils.ts` isMatchTiebreakSet, `edit-score-logic.ts:130-140`). Não corrigir agora como parte deste bug — apenas anotar.

**Validação:** rodar `pnpm test src/core/scoring/__tests__/score-adjustment-mt-formats.test.ts src/core/scoring/__tests__/score-adjustment-integration.test.ts src/components/scoring/__tests__/editScoreHelpers.matchTiebreak.test.ts` antes/depois.

### #5 — Sacador não alterna corretamente ao editar em MT
**Consequência direta de #4** (não bug isolado). `getNextServerAfterSet` (`editScoreHelpers.ts:244-255`) calcula alternância via `tiebreakPoints.player1 + tiebreakPoints.player2 % 2`. Se `tiebreakScore` chega `null` (porque #4 descartou), o branch `if (isMatchTiebreakSet && tiebreakPoints)` falha e cai no fallback (linha 267-280) que retorna apenas `currentServer`. **Fix:** resolver #4 primeiro e re-testar #5 isoladamente.

### #6 — Textos/regras desnecessárias em modo Match Tiebreak
**CONFIRMADO** em `src/components/scoring/edit-score-form.tsx`:
- Linhas 78-100 `getStatusMessage()`: retorna "Match tiebreak em andamento — diferença de 2 pontos necessária" (linha 90). Remover esse branch; deixar `null` em `isMatchTiebreakSet && !isSetTrulyCompleted`.
- Linhas 255-311 (seção "Pontos no Game Atual"): rendre com `disabled={isMatchTiebreakSet}` (linhas 268, 287) e texto "Match Tie-Break usa pontos corridos — desativado" (linhas 305-309). Trocar linha 255 para `{(partial || showGamePointsAtZero) && !isMatchTiebreakSet && (...)}` e remover o `<p>` interno das linhas 305-309.
- A mensagem "Result 2x0 is not valid. A player must win with 10+ points and a 2-point lead" citada pelo usuário **não foi encontrada** nos arquivos do snapshot (busca por "is not valid" e "point lead" não retornau matches). Hipótese: vindo de produção desatualizada, ou composição em arquivo fora do snapshot. Ação: ao implementar #6, buscar `rg "is not valid"` em todo o repo (incluindo `.next` se build servir em produção) e garantir que nada retorne mensagens desse tipo quando `isMatchTiebreakSet === true`.

### #7/#8 — Confirmar não habilita / player2 não atualiza em 6x5 (modo MT)
**Confirmado como consequência de #4 + early-return suspeito.**
- `validateStandardSet`/`validateMatchTiebreakInput` em `editScoreHelpers.ts` está correto: 6x5 em MT → `validateMatchTiebreakInput` (linha 84-113) retorna `{isValid:true, isPartial:true}` (sem error), pois `6 < 10`. Em modo MT o botão Confirmar habilita em `!setValidationError` (`use-edit-score-calculator.ts:95`).
- Em partida MT com `completedSets.length > 0` (porque #4 corrompeu estado), `canConfirm` (linha 89-90) cai `if (state.newSets.length > 0) return true; if (completedSets.length > 0) return true;` — `return true` early sem verificar o set em edição. Esse early-return é **independente** do bug reclado pelo usuário; revisar a ordem dos checks para que set em edição inválido bloqueie o confirm mesmo quando há completedSets.
- **Fix:** corrigir #4 primeiro e re-testar #7/#8. Se persistir, revisar a precedência em `canConfirm` (linhas 89-103) para que o estado do set em edição tenha prioridade; adicionar logs temporários capturando `bothFilled`, `isMatchTiebreakSet`, `hasTiebreak`, `tiebreakRequired`, `isSetTrulyCompleted`.

### #9 — Liberar edição numérica (só bloquear placares inválidos)
**CONFIRMADO** em `src/components/scoring/edit-score-form.tsx:143,157`:
- `<input type="number" min={floorCurrentSets?.player1 ?? 0} ...>` ferra digitação: em alguns navegadores bloqueia digitar valor abaixo do `min`.
- A validação já existe (`floorValidationError` linha 165-167). Não há necessidade de travar no HTML.
- **Fix:** remover atributo `min` dos inputs (linhas 143, 157, 78, 86 em `edit-score-summary.tsx` EditableSetsSummary); manter o `floorValidationError` em tempo real. Garantir que `validateStandardSet`/`validateMatchTiebreak` rejeitam só placares realmente inválidos (ex.: 8/5 em formato MT — revisar a lógica de `maxValid` em `editScoreHelpers.ts:132-137` para MT8/6 etc. — item #9 do usuário é "8/6, 8/5, 7/1 inválidos": confirmar que a validação reflete a regra por formato).

### #10 — "Pontos do game" não aparece em 0/0 do próximo set ao fechar set atual
**CONFIRMADO** em `src/components/scoring/use-edit-score-calculator.ts:108-115`:
```ts
const showGamePointsAtZero = useMemo(() => {
  const hasPreviousSets = completedSets.length > 0 || state.newSets.length > 0;
  const prevSetCompleted = state.newSets.length > 0
    ? state.newSets[state.newSets.length - 1].isPartial === false
    : completedSets.length > 0;
  return hasPreviousSets && isAtZero && prevSetCompleted;
}, ...);
```
Cenário bug: primeiro set da partida sendo fechado **antes** do `handleAddSet` pushar para `state.newSets`. Resultado: `hasPreviousSets=false`, `showGamePointsAtZero=false` — seção não aparece.

**Fix:**
```ts
const hasPreviousSets = completedSets.length > 0 || state.newSets.length > 0 || validation.isSetTrulyCompleted;
const prevSetCompleted = completedSets.length > 0 || state.newSets.length > 0 || validation.isSetTrulyCompleted;
```
Confirmar com characterization test para 1º-set-closing scenario.

### #11 — Permitir editar sets já finalizados
**Já implementado** no snapshot.
- `EditScoreModal.tsx:135-142` rende `<EditableSetsSummary>` passando `onEditSet={handleEditCompletedSet}`, `onRemoveSet={handleRemoveCompletedSet}`.
- `edit-score-summary.tsx:61-113` rende `<input type="number">` por set, chamando `onEditSet(set.index, newValue, set.p2Games)` e `onRemoveSet(set.index)`.
- Handlers em `useEditScoreModal.ts:373-392` atualizam `state.editableCompletedSets`.
- **Porém:** `handleConfirm` (linha 289-293) reconstrói `existingCompleted` a partir de `completedSets` (não de `state.editableCompletedSets`) — logo as edições feitas em sets finalizados via UI **são descartadas** ao confirmar. Para #11 funcionar de verdade: usar `state.editableCompletedSets` se tiver conteúdo, com fallback para `completedSets`.
- **Ação:** confirmar em runtime que após editar um set finalizado e clicar Confirmar, a mudança persiste. Se não persistir, trocar a fonte em `handleConfirm:289` de `completedSets` para `state.editableCompletedSets.length > 0 ? state.editableCompletedSets : completedSets`.

### #3 — Sets finalizados no padrão visual do ScoreboardCard (tela ao vivo)
**Confirmado com o usuário:** referência visual é `src/components/scoring/ScoreboardCard.tsx` (dark mode, highlight verde para atual, roxo para vencedor, classe `font-mono`).
- `EditableSetsSummary` (`edit-score-summary.tsx:64-112`) ainda usa estilo claro (card branco `bg-gray-50`, texto preto `text-gray-700`). Não há highlight para set atual/vencedor, só cor por texto do winner (linha 94).
- **Fix:** alinhar classes Tailwind (manter card escuro `bg-gray-700`/`border-white/5`), `font-mono`, e replicar o highlight de set-vencedor (purple/gray) similar ao `ScoreboardCard.tsx:39-46` em `getSetCellStyle`. Manter inputs editáveis, é claro — só alinhar o visual.
- **Risco:** baixo (visual). Validar com `ScoreboardCard.test.tsx`.

---

## Duplicação de heurística MT (ao longo do repo)

A heurística "este set é Match Tiebreak?" está duplicada com condições ligeiramente diferentes em pelo menos 5 lugares:

| Local | Lógica |
|---|---|
| `engine.flow.ts:366-370` (processTiebreakPoint) | `format+sets.length` |
| `engine.flow.ts:463-467` (isSetComplete) | idem |
| `engine.flow.ts:525-546` (isMatchTiebreakActive) | idem + sub-heurística `p1Sets/p2Sets` por filtro |
| `editScoreHelpers.ts:222-233` (getNextServerAfterSet) | `completedSets.length` + sub-filtros por winner |
| `useSessionManager.utils.ts:144-186` (isMatchTiebreakSet) | mais robusta: conta isPartial e p1Sets/p2Sets antes do índice |
| `edit-score-logic.ts:130-140` (calculateValidation) | relê `format+totalEditedSets` — diverge quando o usuário ainda não adicionou o set em newSets |
|

**Recomendação:** unificar a partir de `useSessionManager.utils.ts:isMatchTiebreakSet` (versão mais completa) e eliminar as outras cópias. A longo prazo, adicionar `isMatchTiebreak?: boolean` em `SetScore` (`types.ts`) e gravar na hora de completar, evitando inferência. **Não corrigir neste bug** (mudança transversal) — apenas registrar em `docs/TECH_DEBT.md`.

---

## Ordem recomendada de execução

1. **#1** — `canEdit={false}` → `canEdit={!isFinished}` (1 linha; desbloqueia testes dos outros bugs em runtime local).
2. **#4** — propagar `tiebreakScore` em `useEditScoreModal.ts:289-293, 345-349`; elevar `normalizeScoreState` para `src/core/scoring/` e usar no read-path; adicionar `BEST_OF_5` ao saneador. Após, validar #5.
3. **#7/#8** — re-testar isoladamente; se persistir, revisar early-return em `canConfirm` (`use-edit-score-calculator.ts:89-90`).
4. **#11** — confirmar persistência das edições via state.editableCompletedSets; trocar fonte em `handleConfirm:289` se necessário.
5. **#6/#9/#10** — UI do modal (`edit-score-form.tsx`, `use-edit-score-calculator.ts`): baixo risco, isolados.
6. **#3** — ajuste visual de `edit-score-summary.tsx` para alinhar ao `ScoreboardCard.tsx`.
7. **TECH_DEBT** — registrar itens: schema `isMatchTiebreak`, unificação de heurística, saneamento read-path durável.

---

## Suíte de testes a rodar antes/depois de cada item

Antes de iniciar (baseline):
```bash
pnpm test src/core/scoring/__tests__ src/components/scoring/__tests__ src/hooks/__tests__/useSessionManager.* src/hooks/__tests__/useScoringHandlers.* --watch=false
pnpm lint
pnpm typecheck
```

Por alvo:
- #1: `src/components/scoring/__tests__`, `src/app/match/[id]/scoring/__tests__/scoring.page.characterization.test.tsx`
- #4/#5/#7/#8: `score-adjustment-mt-formats.test.ts`, `score-adjustment-integration.test.ts`, `editScoreHelpers.matchTiebreak.test.ts`, `EditScoreModal.bugfix.test.ts`, `EditScoreModal.matchFinish.test.tsx`, `engine.test.ts`, `score-adjustment-mt-formats.test.ts`, `char-best-of-5-set4-overgames.test.ts`
- #6/#9/#10: `editScoreHelpers.test.ts`, `EditScoreModal.no-auto-add.test.tsx`, `EditScoreModal.points-dropdown-fix.test.ts`, `EditScoreModal.pointsRepro.test.tsx`
- #11: `EditScoreModal.bugfix.test.ts`, characterization test novo para edição em completed sets.
- #3: `ScoreboardCard.test.tsx` (regressão visual).

E2E (lento, ao final): `pnpm test:e2e` (especialmente `01-full-match-cycle.spec.ts`, `04-undo-redo.spec.ts`).

---

## Characterization tests exigidos pelo AGENTS.md (código legado)

Antes de tocar cada arquivo legado, escrever um characterization test capturando o comportamento atualmente válido, e quebrar intencionalmente na confirmacão:

- `useEditScoreModal.ts` (handleConfirm sem propagar tiebreakScore): caracterização esperando que um mock de CompletedSet com tiebreakScore `{7,5}` resulta em `onConfirm` receber `finalSets` com `tiebreakScore === undefined` (documenta o bug atual).
- `edit-score-form.tsx` (Pontos no Game Atual em MT): caracterização esperando que a seção rende mesmo em `isMatchTiebreakSet=true` (atualmente renderiza desabilitado).
- `match-card-utils.ts:normalizeScoreState`: caracterização para estado `BEST_OF_5` 5th set com `player1:7, player2:6, isTiebreak:false` (documenta que hoje NÃO é saneado).

Após implementação, esses tests serão atualizados para refletir o novo comportamento, e novos testes de regressão para MT/BO5 serão adicionados.

---

## Pendências fora de escopo (delegar a `@backend`/`@arquitetura`)

- Persistência: confirmar com `@backend` que a route `POST /api/matches/[id]/point` e `POST /api/matches/[id]/state` persistem `tiebreakScore` do estado canonical. Se há normalização no write-path (via Prisma), ela não está propagando o campo também.
- Considerar ADR-0005 para saneamento/migration de estado legacy corrupto (read-path + script único de backfill contra-matchstate-snapshot).

---

## Handoff

- `@backend`: itens **#4** (persistência/isMatchTiebreak unificado + read-path normalizer), **#7/#8** se persistir pós-#4 (lógica de `canConfirm`).
- `@frontend`: itens **#1** (1 linha), **#3** (visual), **#6/#9/#10** (UI do modal), **#11** (state source em handleConfirm).
- `@qa`: characterization tests pre-fix; testes de regressão pós-fix; rodar `pnpm test:mutation` em `editScoreHelpers` e `engine.flow`.
- `@arquitetura`: avaliar ADR para `isMatchTiebreak?: boolean` no schema + saneamento read-path, e registrar dívida técnica em `docs/TECH_DEBT.md`.
