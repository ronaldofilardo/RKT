import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import {
  checkMatchPoint,
  checkSetPoint,
  checkBreakPoint,
  isMatchTiebreakSetIndex,
} from "./scoring-domain";

export function derivePointBadges(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { isMatchPoint: boolean; isSetPoint: boolean; isBreakPoint: boolean } {
  if (!effectiveScoreState) {
    return { isMatchPoint: false, isSetPoint: false, isBreakPoint: false };
  }
  const isMatchPoint = checkMatchPoint(effectiveScoreState, format);
  const isSetPoint = !isMatchPoint && checkSetPoint(effectiveScoreState, format);
  const isBreakPoint = !isMatchPoint && !isSetPoint && checkBreakPoint(effectiveScoreState, format);

  return { isMatchPoint, isSetPoint, isBreakPoint };
}

export function deriveTiebreakState(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { isTiebreak: boolean; isSuperTiebreak: boolean } {
  if (!effectiveScoreState) {
    return { isTiebreak: false, isSuperTiebreak: false };
  }

  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  if (!lastSet) {
    return { isTiebreak: false, isSuperTiebreak: false };
  }

  let isTb = lastSet.isTiebreak;
  if (!isTb && lastSet.player1 === 0 && lastSet.player2 === 0 && effectiveScoreState.sets.length > 1) {
    const prevSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 2];
    isTb = prevSet?.isTiebreak ?? false;
  }

  const isSuperTb = isTb
    ? isMatchTiebreakSetIndex(
        format as TennisFormat | undefined,
        effectiveScoreState.sets.length - 1,
        effectiveScoreState.setsWon,
      )
    : false;

  return { isTiebreak: isTb, isSuperTiebreak: isSuperTb };
}
