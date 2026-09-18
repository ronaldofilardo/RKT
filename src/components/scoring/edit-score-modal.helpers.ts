import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import { validateSetResult } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";

type Player = "player1" | "player2";

export function getAllCompletedSets(
  editableCompletedSets: SetEditData[],
  completedSets: CompletedSet[],
  newSets: SetEditData[]
): SetEditData[] {
  if (editableCompletedSets.length > 0) {
    return [...editableCompletedSets, ...newSets];
  }
  const mapped: SetEditData[] = completedSets.map((cs) => ({
    p1Games: cs.games.player1,
    p2Games: cs.games.player2,
    isPartial: false,
    ...(cs.tiebreakScore ? { tiebreakScore: cs.tiebreakScore } : {}),
  }));
  return [...mapped, ...newSets];
}

export function computeCompletedSetValidationErrors(
  allCompletedSets: SetEditData[],
  matchFormat: TennisFormat
): Record<number, string> {
  const errors: Record<number, string> = {};
  allCompletedSets.forEach((s, idx) => {
    const v = validateSetResult({ p1Games: s.p1Games, p2Games: s.p2Games }, matchFormat);
    if (v.error && !v.isPartial) {
      errors[idx] = v.error;
    }
  });
  return errors;
}

function determineSetWinner(s: SetEditData): Player | null {
  if (s.p1Games > s.p2Games) return "player1";
  if (s.p2Games > s.p1Games) return "player2";
  if (s.tiebreakScore) {
    return s.tiebreakScore.player1 > s.tiebreakScore.player2 ? "player1" : "player2";
  }
  return null;
}

export function buildEditableCompletedSets(
  allCompletedSets: SetEditData[],
  validationErrors: Record<number, string>
) {
  return allCompletedSets.map((s, idx) => {
    const hasValidationError = Boolean(validationErrors[idx]);
    const isValidSet = !s.isPartial && !hasValidationError;
    const winner = isValidSet ? determineSetWinner(s) : null;
    return {
      p1Games: s.p1Games,
      p2Games: s.p2Games,
      winner,
      index: idx,
      isPartial: s.isPartial,
      hasValidationError,
    };
  });
}
