function isMatchTiebreakFormat(format: string) {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10';
}

function shouldNormalizeSet(set: any) {
  return Boolean(set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore);
}

function createNormalizedSet(set: any) {
  return { ...set, tiebreakScore: { player1: set.player1, player2: set.player2 }, player1: 0, player2: 0, isTiebreak: true };
}

function assignNormalizedSet(result: any, format: string, setIndex: number, newSet: any) {
  if (format === 'MATCH_TB_10') result.sets = [newSet];
  else result.sets[setIndex] = newSet;
}

export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  if (!scoreState || !isMatchTiebreakFormat(format)) return scoreState;
  const result = { ...scoreState };
  if (result.sets?.length >= 1) {
    const setIndex = format === 'MATCH_TB_10' ? 0 : result.sets.length - 1;
    const set = result.sets[setIndex];
    if (shouldNormalizeSet(set)) assignNormalizedSet(result, format, setIndex, createNormalizedSet(set));
  }
  return result;
}

function isStoredRegularTiebreakSet(set: any) {
  return !set.isTiebreak && Boolean(set.tiebreakScore) && (set.player1 > 0 || set.player2 > 0);
}

function hasScoreRegression(oldSet: any, newSet: any) {
  return (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) || (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1);
}

export function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet || !isStoredRegularTiebreakSet(oldSet)) return false;
  return hasScoreRegression(oldSet, newSet);
}
