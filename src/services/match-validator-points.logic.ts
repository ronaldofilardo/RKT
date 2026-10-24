import type { MatchScoreState } from "@/schemas/match";

/** Derivados de MatchScoreState para casar exatamente com o que flui das rotas. */
type MatchSetScore = MatchScoreState["sets"][number];
type MatchGameScore = MatchScoreState["currentGame"];
type TiebreakScore = NonNullable<MatchSetScore["tiebreakScore"]>;

export function getGamePointCount(
  cg: MatchGameScore | null | undefined,
  player: "player1" | "player2",
): number {
  if (!cg) return 0;
  const p = typeof cg[player] === "number" ? cg[player] : 0;
  if (cg.isDeuce) {
    if (cg.advantage === player) return 4;
    return 3;
  }
  return p;
}

export function isCurrentGameRegressing(
  oldCG: MatchGameScore | null | undefined,
  newCG: MatchGameScore | null | undefined,
): boolean {
  if (!oldCG || !newCG) return false;

  const oldP1 = getGamePointCount(oldCG, "player1");
  const oldP2 = getGamePointCount(oldCG, "player2");
  const newP1 = getGamePointCount(newCG, "player1");
  const newP2 = getGamePointCount(newCG, "player2");

  return isCoordinateRegressing(oldP1, oldP2, newP1, newP2);
}

function isCoordinateRegressing(
  oldP1: number,
  oldP2: number,
  newP1: number,
  newP2: number,
): boolean {
  return newP1 < oldP1 || newP2 < oldP2;
}

function isSameWinnerCorrection(oldTb: TiebreakScore, newTb: TiebreakScore): boolean {
  const oldWinner =
    oldTb.player1 === oldTb.player2
      ? null
      : oldTb.player1 > oldTb.player2
        ? "player1"
        : "player2";
  const newWinner =
    newTb.player1 === newTb.player2
      ? null
      : newTb.player1 > newTb.player2
        ? "player1"
        : "player2";
  return oldWinner !== null && oldWinner === newWinner;
}

export function isTiebreakRegressing(
  oldSet: MatchSetScore | null | undefined,
  newSet: MatchSetScore | null | undefined,
): boolean {
  if (!oldSet || !newSet) return false;

  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;

  if (oldTb && newTb) {
    // Se o vencedor do tiebreak é o mesmo, é uma correção (ex.: 10-8 → 10-6),
    // não regressão. Só bloquear se o vencedor mudou.
    if (isSameWinnerCorrection(oldTb, newTb)) return false;
    return isCoordinateRegressing(oldTb.player1, oldTb.player2, newTb.player1, newTb.player2);
  }

  const isOldStartedTiebreak =
    oldSet.isTiebreak && (oldSet.player1 > 0 || oldSet.player2 > 0);

  if (oldTb && !newTb && isOldStartedTiebreak) {
    return isCoordinateRegressing(oldSet.player1, oldSet.player2, newSet.player1, newSet.player2);
  }

  const isSixAllTiebreak =
    oldSet.isTiebreak && !oldTb && oldSet.player1 >= 6 && oldSet.player2 >= 6;
  const hasNewSetProgress = newSet.player1 > 0 || newSet.player2 > 0;

  if (isSixAllTiebreak && hasNewSetProgress) {
    return isCoordinateRegressing(oldSet.player1, oldSet.player2, newSet.player1, newSet.player2);
  }

  return false;
}
