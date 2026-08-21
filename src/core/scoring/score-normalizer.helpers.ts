import type { TennisFormat } from './types';
export type CompletedSets = { p1Won: number; p2Won: number };

export function isMatchTiebreakSetIndex(
  setIndex: number,
  _totalSets: number,
  format: TennisFormat,
  completedSetsBefore: CompletedSets = { p1Won: 0, p2Won: 0 },
): boolean {
  const setNum = setIndex + 1;
  if (format === 'MATCH_TB_10') return setNum === 1;
  if (format === 'BEST_OF_5' && setNum === 5) {
    return completedSetsBefore.p1Won === 2 && completedSetsBefore.p2Won === 2;
  }
  if (
    (format === 'BEST_OF_3_MATCH_TB'
      || format === 'BEST_OF_3_NO_AD'
      || format === 'SHORT_SET_2V2_NO_AD')
    && setNum === 3
  ) {
    return completedSetsBefore.p1Won === 1 && completedSetsBefore.p2Won === 1;
  }
  return false;
}

export function looksLikeMatchTiebreakFormat(format: TennisFormat): boolean {
  return format === 'MATCH_TB_10'
    || format === 'BEST_OF_3_MATCH_TB'
    || format === 'BEST_OF_5'
    || format === 'BEST_OF_3_NO_AD'
    || format === 'SHORT_SET_2V2_NO_AD';
}

function isCorruptedMatchTiebreakSet(set: any, isMtSet: boolean): boolean {
  return Boolean(
    isMtSet
      && set
      && (set.player1 > 0 || set.player2 > 0)
      && !set.isTiebreak
      && !set.tiebreakScore,
  );
}

function sanitizeMatchTiebreakSet(set: any) {
  return {
    ...set,
    tiebreakScore: { player1: set.player1, player2: set.player2 },
    player1: 0,
    player2: 0,
    isTiebreak: true,
  };
}

function countCompletedSet(set: any, completed: CompletedSets): void {
  if (!set) return;
  if (set.player1 > set.player2) completed.p1Won++;
  else if (set.player2 > set.player1) completed.p2Won++;
}

function updateCompletedSets(set: any, completed: CompletedSets): void {
  if (!set) return;
  if (!set.isTiebreak || set.tiebreakScore) countCompletedSet(set, completed);
}

export function normalizeMatchTiebreakSets(sets: any[], format: TennisFormat): any[] {
  const completed: CompletedSets = { p1Won: 0, p2Won: 0 };
  return sets.map((set, idx) => {
    const isMtSet = isMatchTiebreakSetIndex(idx, sets.length, format, completed);
    if (isCorruptedMatchTiebreakSet(set, isMtSet)) return sanitizeMatchTiebreakSet(set);
    updateCompletedSets(set, completed);
    return set;
  });
}

export function addDefaultCurrentGame(parsed: any) {
  return {
    ...parsed,
    currentGame: parsed.currentGame ?? {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
    },
  };
}

export function hasSetsProperty(parsed: any): boolean {
  return Boolean(parsed?.sets);
}

export function finalizeNormalizedState(parsed: any): any | null {
  if (parsed?.sets && parsed?.currentGame) return parsed;
  if (parsed?.sets && Array.isArray(parsed.sets)) return addDefaultCurrentGame(parsed);
  return null;
}
