import { unwrapScoreState } from "./match-validator-envelope";
import {
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from "./match-validator-points.logic";
import type { ValidationResult } from "./match-validator-types";

function isSetsWonRegressing(
  oldWon: { player1?: number; player2?: number },
  newWon: { player1?: number; player2?: number },
): boolean {
  return (
    typeof newWon.player1 === "number" &&
    typeof newWon.player2 === "number" &&
    (newWon.player1 < (oldWon.player1 ?? 0) || newWon.player2 < (oldWon.player2 ?? 0))
  );
}

export function validateScoreProgression(
  rawOldScoreState: unknown,
  rawNewScoreState: unknown,
  allowScoreEdit?: boolean,
  isManualScoreEdit?: boolean,
): ValidationResult | null {
  const oldState = unwrapScoreState(rawOldScoreState);
  const newState_ = unwrapScoreState(rawNewScoreState);
  const oldWon = oldState?.setsWon ?? { player1: 0, player2: 0 };
  const newWon = newState_?.setsWon ?? { player1: 0, player2: 0 };

  if (!isManualScoreEdit && isSetsWonRegressing(oldWon, newWon)) {
    return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
  }

  // Verificação de regressão de tiebreak - sempre aplicável, mesmo em modo de edição
  const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
  const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];

  if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
    return { error: "SCORE_REGRESSION: Tie-break não pode regredir", valid: false };
  }

  if (!allowScoreEdit) {
    const isSameSetsWon =
      typeof newWon.player1 === "number" &&
      typeof newWon.player2 === "number" &&
      newWon.player1 === oldWon.player1 &&
      newWon.player2 === oldWon.player2;

    if (isSameSetsWon && isCurrentGameRegressing(oldState?.currentGame, newState_?.currentGame)) {
      const sameCurrentGameContext =
        oldLastSet && newLastSet
          ? oldLastSet.player1 === newLastSet.player1 && oldLastSet.player2 === newLastSet.player2
          : true;

      if (sameCurrentGameContext) {
        return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
      }
    }
  }

  return null;
}
