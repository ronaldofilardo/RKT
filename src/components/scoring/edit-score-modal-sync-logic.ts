import { createInitialEditScoreState } from "@/core/scoring/edit-score-state";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";

export function createInitialModalState(currentServer: "player1" | "player2", completedSets: CompletedSet[]): EditScoreModalState {
  return {
    ...createInitialEditScoreState(currentServer),
    editableCompletedSets: completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    })),
  };
}

export function updateEditableCompletedSets(
  completedSets: CompletedSet[],
  prevSets: EditScoreModalState['editableCompletedSets'],
  editedIndices: Set<number>,
) {
  return completedSets.map((cs, index) => {
    if (editedIndices.has(index) && prevSets[index]) {
      return prevSets[index];
    }
    return {
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    };
  });
}

export function serializeCompletedSets(completedSets: CompletedSet[]): string {
  return completedSets
    .map((cs) => `${cs.games.player1}-${cs.games.player2}-${cs.winner}${cs.tiebreakScore ? `:${cs.tiebreakScore.player1}-${cs.tiebreakScore.player2}` : ""}`)
    .join("|");
}

export function applyInitialGamePoints(
  currentGamePoints: { player1: number | string; player2: number | string } | undefined,
  isTiebreak: boolean | undefined,
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>,
  initialGameRef: React.MutableRefObject<{ player1: string; player2: string } | null>,
) {
  if (!currentGamePoints) return;
  const p1 = typeof currentGamePoints.player1 === "number" ? currentGamePoints.player1.toString() : currentGamePoints.player1;
  const p2 = typeof currentGamePoints.player2 === "number" ? currentGamePoints.player2.toString() : currentGamePoints.player2;
  initialGameRef.current = { player1: p1, player2: p2 };
  if (isTiebreak) {
    setState((prev) => ({ ...prev, tiebreakP1: p1, tiebreakP2: p2 }));
  } else {
    setState((prev) => ({ ...prev, p1Points: p1, p2Points: p2 }));
  }
}
