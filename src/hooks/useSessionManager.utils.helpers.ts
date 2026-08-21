import type { SetEditData } from '@/components/scoring/editScoreHelpers';

function isMatchTiebreakFormat(format: string): boolean {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10'
    || format === 'BEST_OF_5' || format === 'SHORT_SET_2V2_NO_AD'
    || format === 'BEST_OF_3_NO_AD';
}

function scorePair(set: SetEditData) {
  const tb = set.tiebreakScore;
  return { player1: tb ? tb.player1 : set.p1Games, player2: tb ? tb.player2 : set.p2Games };
}

function wonByTwo(first: number, second: number, minimum: number): boolean {
  return first >= minimum && first - second >= 2;
}

function normalizeSet(set: any) {
  return {
    ...set,
    tiebreakScore: { player1: set.player1, player2: set.player2 },
    player1: 0,
    player2: 0,
    isTiebreak: true,
  };
}

function getNormalizationTarget(scoreState: any, format: string) {
  if (!scoreState || !isMatchTiebreakFormat(format) || !scoreState.sets?.length) return null;
  const index = format === 'MATCH_TB_10' ? 0 : scoreState.sets.length - 1;
  const set = scoreState.sets[index];
  if (!set || !(set.player1 > 0 || set.player2 > 0) || set.isTiebreak || set.tiebreakScore) return null;
  return { index, set };
}

function replaceNormalizationTarget(scoreState: any, format: string, index: number, set: any) {
  const result = { ...scoreState };
  const newSet = normalizeSet(set);
  result.sets = format === 'MATCH_TB_10'
    ? [newSet]
    : result.sets.map((item: any, i: number) => i === index ? newSet : item);
  return result;
}

export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  const target = getNormalizationTarget(scoreState, format);
  return target ? replaceNormalizationTarget(scoreState, format, target.index, target.set) : scoreState;
}

export function getMatchTiebreakIndex(format: string, resultLength: number): number | null {
  if (!isMatchTiebreakFormat(format)) return null;
  const index = format === 'MATCH_TB_10' ? 0 : format === 'BEST_OF_5' ? 4 : 2;
  return resultLength === 1 ? 0 : index;
}

export function validateMatchTiebreakComplete(
  setResults: SetEditData[],
  format: string,
): { valid: boolean; error?: string } {
  const index = getMatchTiebreakIndex(format, setResults.length);
  if (index === null) return { valid: true };
  const set = setResults[index];
  if (!set || set.isPartial) return { valid: true };
  const score = scorePair(set);
  if (wonByTwo(score.player1, score.player2, 10) || wonByTwo(score.player2, score.player1, 10)) return { valid: true };
  if ((score.player1 >= 10 || score.player2 >= 10) && Math.abs(score.player1 - score.player2) < 2) return { valid: true };
  return { valid: false, error: 'MATCH_TIEBREAK_INCOMPLETE: Match tie-break requer 10 pontos com diferença mínima de 2' };
}

function countSetWinner(set: SetEditData, isMatch: boolean): 'player1' | 'player2' | null {
  const score = scorePair(set);
  if (isMatch) {
    if (wonByTwo(score.player1, score.player2, 10)) return 'player1';
    if (wonByTwo(score.player2, score.player1, 10)) return 'player2';
  } else if (set.tiebreakScore) {
    if (wonByTwo(score.player1, score.player2, 7)) return 'player1';
    if (wonByTwo(score.player2, score.player1, 7)) return 'player2';
  } else if (!set.isPartial) {
    if (set.p1Games > set.p2Games) return 'player1';
    if (set.p2Games > set.p1Games) return 'player2';
  }
  return null;
}

export function calculateSetsWon(setResults: SetEditData[], format: string): { player1: number; player2: number } {
  const result = { player1: 0, player2: 0 };
  setResults.forEach((set, index) => {
    const winner = countSetWinner(set, isMatchTiebreakSet(index, setResults, format));
    if (winner) result[winner] += 1;
  });
  return result;
}

function countRegularSets(setResults: SetEditData[], index: number) {
  return setResults.slice(0, index).reduce((result, set) => {
    if (!set || set.isPartial) return result;
    if (set.p1Games > set.p2Games) result.player1 += 1;
    else if (set.p2Games > set.p1Games) result.player2 += 1;
    return result;
  }, { player1: 0, player2: 0 });
}

function isGrandSlamDecidingSet(index: number, sets: SetEditData[], score: { player1: number; player2: number }) {
  if (index !== 4 || score.player1 !== 2 || score.player2 !== 2) return false;
  const current = sets[index];
  if (!current || current.p1Games !== 6 || current.p2Games !== 6) return false;
  return true;
}

function isOneAllDecidingSet(index: number, format: string, score: { player1: number; player2: number }) {
  const supported = format === 'BEST_OF_3_MATCH_TB' || format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD';
  return supported && index === 2 && score.player1 === 1 && score.player2 === 1;
}

export function isMatchTiebreakSet(index: number, setResults: SetEditData[], format: string): boolean {
  const currentSetNumber = index + 1;
  if (format === 'MATCH_TB_10') return currentSetNumber === 1;
  const score = countRegularSets(setResults, index);
  if (format === 'BEST_OF_5') return currentSetNumber === 5 && isGrandSlamDecidingSet(index, setResults, score);
  return isOneAllDecidingSet(index, format, score);
}
