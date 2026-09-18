import { parsePointValue, pointToProgress } from "@/core/scoring/point-utils";

export function validateTiebreakFloor(
  state: { tiebreakP1: string; tiebreakP2: string },
  floorCurrentSets?: { player1: number; player2: number } | null,
): string | null {
  if (!floorCurrentSets) return null;
  const tbFloorP1 = floorCurrentSets.player1;
  const tbFloorP2 = floorCurrentSets.player2;
  const currentTbP1 = Number(state.tiebreakP1) || 0;
  const currentTbP2 = Number(state.tiebreakP2) || 0;
  if (currentTbP1 < tbFloorP1 || currentTbP2 < tbFloorP2) {
    return `Placar do tiebreak não pode ser inferior ao ponto de parada (${tbFloorP1}x${tbFloorP2}).`;
  }
  return null;
}

export function validateGamePointsRegression(
  initialGame: { player1: string; player2: string } | null,
  p1Points: string,
  p2Points: string,
): string | null {
  if (!initialGame) return null;
  const oldP1 = pointToProgress(parsePointValue(initialGame.player1));
  const oldP2 = pointToProgress(parsePointValue(initialGame.player2));
  const newP1 = pointToProgress(parsePointValue(p1Points));
  const newP2 = pointToProgress(parsePointValue(p2Points));
  if ((newP1 < oldP1 && newP2 <= oldP2) || (newP2 < oldP2 && newP1 <= oldP1)) {
    return "Placar não pode ser inferior ao estado atual";
  }
  return null;
}

export function validateTiebreakPointsRegression(
  initialGame: { player1: string; player2: string } | null,
  tiebreakP1: string,
  tiebreakP2: string,
): string | null {
  if (!initialGame) return null;
  const initialTbP1 = Number(initialGame.player1) || 0;
  const initialTbP2 = Number(initialGame.player2) || 0;
  const currentTbP1 = Number(tiebreakP1) || 0;
  const currentTbP2 = Number(tiebreakP2) || 0;
  if ((currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
      (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)) {
    return "Placar do tiebreak não pode ser inferior ao estado atual";
  }
  return null;
}

export function validateTiebreakWinnerMatch(
  bothFilled: boolean,
  hasTiebreak: boolean,
  isSetTrulyCompleted: boolean,
  tiebreakComplete: boolean | undefined,
  p1Val: number,
  p2Val: number,
  tiebreakP1Num: number,
  tiebreakP2Num: number,
): string | null {
  if (bothFilled && hasTiebreak && isSetTrulyCompleted && tiebreakComplete && p1Val !== p2Val) {
    const setWinner = p1Val > p2Val ? "player1" : "player2";
    const tiebreakWinner = tiebreakP1Num > tiebreakP2Num ? "player1" : "player2";
    if (setWinner !== tiebreakWinner) {
      return "Vencedor do tiebreak não corresponde ao vencedor do set.";
    }
  }
  return null;
}
