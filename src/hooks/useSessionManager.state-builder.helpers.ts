import type { SetEditData } from '@/components/scoring/editScoreHelpers';
import type { ScoringState, TennisFormat } from '@/core/scoring/types';
import { parsePointValue } from '@/core/scoring/point-utils';
import { isMatchTiebreakSet } from './useSessionManager.utils';
import { getMatchFormatRules, validateSetScore } from '@/lib/matchConfig';

function hasWonByTwo(first: number, second: number, minimum: number): boolean {
  return first >= minimum && first - second >= 2;
}

function isMatchTiebreakComplete(set: SetEditData): boolean {
  const tb = set.tiebreakScore;
  const p1 = tb ? tb.player1 : set.p1Games;
  const p2 = tb ? tb.player2 : set.p2Games;
  return hasWonByTwo(p1, p2, 10) || hasWonByTwo(p2, p1, 10);
}

function isRegularTiebreakComplete(set: SetEditData): boolean {
  const tb = set.tiebreakScore;
  if (!tb) return false;
  return hasWonByTwo(tb.player1, tb.player2, 7)
    || hasWonByTwo(tb.player2, tb.player1, 7);
}

function isStandardSetComplete(set: SetEditData, format: string): boolean {
  try {
    const rules = getMatchFormatRules(format as TennisFormat);
    return validateSetScore(set.p1Games, set.p2Games, rules).complete;
  } catch {
    const diff = Math.abs(set.p1Games - set.p2Games);
    const max = Math.max(set.p1Games, set.p2Games);
    return (max >= 6 && diff >= 2) || (max === 7 && diff >= 1 && max >= 6);
  }
}

export function isLastSetFinalized(set: SetEditData, format: string): boolean {
  if (!set || set.isPartial) return false;
  if (format === 'MATCH_TB_10') return isMatchTiebreakComplete(set);
  if (isRegularTiebreakComplete(set)) return true;
  return isStandardSetComplete(set, format);
}

export function buildEmptyCurrentGame(): ScoringState['currentGame'] {
  return {
    player1: 0,
    player2: 0,
    isDeuce: false,
    advantage: null,
    secondServe: false,
  };
}

function isFinalizedMatchTiebreak(
  setResults: SetEditData[],
  format: string,
): boolean {
  if (setResults.length === 0) return false;
  const index = setResults.length - 1;
  return isMatchTiebreakSet(index, setResults, format)
    && setResults[index]?.isPartial === false;
}

function getPartialGamePoints(partialSet?: SetEditData) {
  const useGamePoints = partialSet?.isPartial === true;
  return {
    player1: useGamePoints ? parsePointValue(partialSet.currentGamePoints?.player1 ?? 0) : 0,
    player2: useGamePoints ? parsePointValue(partialSet.currentGamePoints?.player2 ?? 0) : 0,
  };
}

export function buildCurrentGameFromSet(
  setResults: SetEditData[],
  format: string,
  partialSet?: SetEditData,
): ScoringState['currentGame'] {
  if (isFinalizedMatchTiebreak(setResults, format)) return buildEmptyCurrentGame();
  return {
    ...getPartialGamePoints(partialSet),
    isDeuce: false,
    advantage: null,
    secondServe: false,
  };
}
