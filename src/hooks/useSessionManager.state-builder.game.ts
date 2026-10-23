import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { parsePointValue } from "@/core/scoring/point.logic";
import { isMatchTiebreakSet } from "./use-session-manager.logic";

export function buildCurrentGame(
  setResults: SetEditData[],
  format: string,
  partialSet?: SetEditData
): ScoringState["currentGame"] {
  const isLastSet = setResults.length > 0;
  const lastSetIdx = setResults.length - 1;
  const lastSetEntry = isLastSet ? setResults[lastSetIdx] : undefined;
  // MTB concluído: não há game point pendente
  const isMTSetFinalized = isLastSet && isMatchTiebreakSet(lastSetIdx, setResults, format) && lastSetEntry?.isPartial === false;
  // MTB em andamento (parcial): também não usa game points — o progresso
  // fica em tiebreakScore, não em currentGame.
  const isMTSetPartial = isLastSet && isMatchTiebreakSet(lastSetIdx, setResults, format) && lastSetEntry?.isPartial === true;

  if (isMTSetFinalized || isMTSetPartial) {
    return {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    };
  }

  // If set is partial (incomplete), preserve the current game points selected by user
  // If set is complete, reset game points to 0
  const shouldUseGamePoints = partialSet?.isPartial === true;

  const p1Val = shouldUseGamePoints ? parsePointValue(partialSet.currentGamePoints?.player1 ?? 0) : 0;
  const p2Val = shouldUseGamePoints ? parsePointValue(partialSet.currentGamePoints?.player2 ?? 0) : 0;

  let isDeuce = false;
  let advantage: "player1" | "player2" | null = null;

  if (p1Val === 3 && p2Val === 3) {
    isDeuce = true;
  } else if (p1Val === 4 && p2Val === 3) {
    isDeuce = true;
    advantage = "player1";
  } else if (p1Val === 3 && p2Val === 4) {
    isDeuce = true;
    advantage = "player2";
  }

  return {
    player1: p1Val,
    player2: p2Val,
    isDeuce,
    advantage,
    secondServe: false,
  };
}
