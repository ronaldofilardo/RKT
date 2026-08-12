PLANO — Ajustar Placar (EditScoreModal / edit-score-form / scoring-logic)

Item 1: 6/6 → abrir tiebreak com números (1, 2, 3...) e confirmar
- Arquivos: edit-score-form.tsx (inputs tiebreak), edit-score-logic.ts (calculateValidation / hasTiebreak), useEditScoreModal.ts (handleConfirm), editScoreHelpers.ts (validateStandardSet).
- Passos:
  a) Garantir que quando p1Val === 6 e p2Val === 6 (e format tem tiebreak), `hasTiebreak` seja true e `tiebreakRequired` seja true.
  b) Os inputs de tiebreak (tiebreakP1, tiebreakP2) devem aceitar valores numéricos (não GAME_POINTS).
  c) `handleConfirm` deve exigir `tiebreakComplete` quando `tiebreakRequired` é true e `isSetTrulyCompleted` depende do tiebreak.
  d) Corrigir `canConfirmSet` / `canConfirm` para não bloquear quando `tiebreakComplete` é true.

Item 2: Remover mensagem "jogador venceu set" abaixo dos números ao digitar 6
- Arquivo: edit-score-form.tsx (`getStatusMessage`).
- Passos:
  a) Quando `isMatchTiebreakSet` é false mas ainda não completou o set (ex: digitando 6 mas sem confirmar o game ou tiebreak), não exibir `"${winner} venceu o set"`.
  b) Deixar apenas o botão "Confirmar" (e mensagens de tiebreak se necessário) até que o set esteja de fato completo (`isSetTrulyCompleted`).
  c) Manter apenas a chave de confirmar placar, sem mensagens prematuras de vitória de set.

Item 3: 5º set em 6/6 → abrir placar 0/0 para Match Tiebreak (não somar ao game 6)
- Arquivos: edit-score-form.tsx (display), edit-score-logic.ts (isMatchTiebreakSet / isPotentialMTSet), editScoreHelpers.ts (validateStandardSet / validateMatchTiebreakInput).
- Passos:
  a) Em BO5, quando totalEditedSets === 4 (5º set) e p1Val === 6 e p2Val === 6, `isMatchTiebreakSet` deve ser true (não `potentialMT`).
  b) Quando `isMatchTiebreakSet` é true, os inputs devem ser tratados como pontos de MT (0/0 inicial), não como games (6/6 adicionados ao set anterior).
  c) Em `createSetEditData`, quando `isMatchTiebreakSet`, salvar `tiebreakScore` com os valores digitados, e `p1Games`/`p2Games` devem ser 0/0 (ou tratados como pontos do MT).
  d) Corrigir `handleAddSet` / `handleConfirm` para que, ao confirmar MT, não some ao set anterior.

Item 4: Sincronia BO5 — 5º set normal vs Match Tiebreak / scoreboard
- Arquivos: edit-score-logic.ts (isPotentialMTSet / isMatchTiebreakSet), useEditScoreModal.ts, edit-score-form.tsx, scoring-logic.ts (getGameScoreLabel / isTiebreak), score-normalizer.ts.
- Passos:
  a) Separar claramente: 5º set regular (até 6/6) vs MT (quando 6-6, ou quando já é MT decidido). `isPotentialMTSet` só ativa quando está no 5º set e ainda não chegou a 6-6; `isMatchTiebreakSet` ativa quando é MT ativo.
  b) No scoreboard (`scoring-logic.ts`), para sets `isTiebreak: true`, exibir pontos como números (`1x0`, `2x1` etc.), não como `15/30/40/AD`.
  c) Quando `isMatchTiebreakSet` é true, os inputs devem aceitar apenas números de pontos (não `GAME_POINTS` de game). Corrigir `edit-score-form.tsx` para ocultar `showGamePointsAtZero` e `GAME_POINTS` quando `isMatchTiebreakSet` é true.
  d) Evitar que pontos do 5º set (quando ainda é regular) sejam somados ao 4º set: validar que `totalEditedSets` conta corretamente e que `newSets` não sobrescreve `completedSets` de forma errada.
  e) Corrigir `validateStandardSet`: bloquear placares inválidos (8/6, 8/5, 7/1) verificando que, se `hasTiebreak`, o vencedor com 7 games só é válido se o perdedor tem 5 ou 6 games (`gamesNeeded - 1` ou `gamesNeeded`). Se o perdedor tem menos que `gamesNeeded - 1`, é inválido (ex: 8/5 é válido, 8/4 é inválido; 7/5 é válido, 7/4 é inválido; 7/1 é inválido).

Item 5: Bloquear placares inválidos (8/6, 8/5, 7/1) — sincronia com placar, editar e modo
- Arquivos: editScoreHelpers.ts (validateStandardSet / validateMatchTiebreak), edit-score-logic.ts, edit-score-form.tsx.
- Passos:
  a) Em `validateStandardSet`, reforçar a regra: para `hasTiebreak` verdadeiro, se `winnerGames === gamesNeeded + 1` (7 em BO3/BO5 padrão), `loserGames` deve ser `gamesNeeded` (6) ou `gamesNeeded - 1` (5). Qualquer valor abaixo de 5 (como 1, 2, 3, 4) deve retornar `isValid: false` com `error: 'Invalid set score'`.
  b) Adicionar validação para `MATCH_TB_10`: bloquear valores que não respeitam a regra de 10 pontos + 2 de diferença, e também bloquear valores absurdos (ex: 15/0 seria válido, mas garantir limite razoável).
  c) Em `edit-score-form.tsx`, garantir que `p1Input`/`p2Input` não aceitem valores que gerariam placares inválidos conforme o modo de jogo (`matchFormat`). Usar `max` de forma condicional (ex: para MT, max pode ser 30; para set regular, max 8 ou 9 conforme formato).
  d) Sincronizar `matchFormat` com `matchState` para que `maxSets` e `setsToWin` estejam consistentes ao bloquear placares.

Observações Gerais:
- Arquivos tocados: `src/components/scoring/edit-score-form.tsx`, `src/components/scoring/edit-score-logic.ts`, `src/components/scoring/useEditScoreModal.ts`, `src/components/scoring/use-edit-score-calculator.ts`, `src/components/scoring/editScoreHelpers.ts`, `src/core/scoring/scoring-logic.ts`, `src/core/scoring/score-normalizer.ts`.
- Prioridade: Itens 3 e 4 são críticos (sincronia BO5 / MT). Item 1 é funcional (tiebreak confirma). Item 2 é UX. Item 5 é proteção.
- Depois das mudanças, rodar `pnpm test:components` e `pnpm test` para validar.
