import type { ScoringEngineConfig, ScoringState, SetScore } from './types';

export function addWinnerPoint(
  winner: 'player1' | 'player2',
  score: { player1: number; player2: number },
): { player1: number; player2: number } {
  return {
    player1: score.player1 + (winner === 'player1' ? 1 : 0),
    player2: score.player2 + (winner === 'player2' ? 1 : 0),
  };
}

export function getNextServer(
  total: number,
  server: 'player1' | 'player2',
): 'player1' | 'player2' {
  if (total % 2 === 0) return server;
  return server === 'player1' ? 'player2' : 'player1';
}

export function isMatchTiebreakComplete(score: { player1: number; player2: number }): boolean {
  return (score.player1 >= 10 || score.player2 >= 10)
    && Math.abs(score.player1 - score.player2) >= 2;
}

export function createMatchTiebreakSet(
  winner: 'player1' | 'player2',
  score: { player1: number; player2: number },
): SetScore {
  return {
    player1: winner === 'player1' ? 1 : 0,
    player2: winner === 'player2' ? 1 : 0,
    isTiebreak: true,
    tiebreakScore: score,
  };
}

export function updateCompletedMatchTiebreak(
  state: ScoringState,
  winner: 'player1' | 'player2',
  score: { player1: number; player2: number },
  newServer: 'player1' | 'player2',
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const completedSet: SetScore = {
    ...currentSet,
    isTiebreak: true,
    tiebreakScore: score,
  };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = completedSet;
  const setsWon = { ...state.setsWon };
  setsWon[winner]++;
  state.sets = newSets;
  state.setsWon = setsWon;
  state.isFinished = true;
  state.winner = winner;
  state.server = newServer;
  return state;
}

export function isDecidingSetFormat(format: ScoringEngineConfig['format']): boolean {
  return format === 'BEST_OF_5'
    || format === 'BEST_OF_3_MATCH_TB'
    || format === 'SHORT_SET_2V2_NO_AD'
    || format === 'BEST_OF_3_NO_AD';
}

export function isMatchTiebreakStartFormat(format: ScoringEngineConfig['format']): boolean {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'BEST_OF_3_NO_AD';
}

export function hasOneSetEach(state: ScoringState): boolean {
  return state.setsWon.player1 === 1
    && state.setsWon.player2 === 1
    && state.sets.length === 2;
}

export function countRegularSets(state: ScoringState): { player1: number; player2: number } {
  return state.sets.reduce(
    (counts, set) => {
      if (set.isTiebreak) return counts;
      if (set.player1 > set.player2) counts.player1++;
      else if (set.player2 > set.player1) counts.player2++;
      return counts;
    },
    { player1: 0, player2: 0 },
  );
}

function isBestOfFiveDecidingSet(
  state: ScoringState,
  format: ScoringEngineConfig['format'],
  counts: { player1: number; player2: number },
): boolean {
  return format === 'BEST_OF_5'
    && state.sets.length === 5
    && counts.player1 === 2
    && counts.player2 === 2
    && state.sets[4]?.isTiebreak === true;
}

function isBestOfThreeDecidingSet(
  state: ScoringState,
  format: ScoringEngineConfig['format'],
  counts: { player1: number; player2: number },
): boolean {
  const isSupportedFormat = format === 'BEST_OF_3_MATCH_TB'
    || format === 'SHORT_SET_2V2_NO_AD'
    || format === 'BEST_OF_3_NO_AD';
  return isSupportedFormat
    && state.sets.length === 3
    && counts.player1 === 1
    && counts.player2 === 1;
}

export function isActiveDecidingSet(
  state: ScoringState,
  format: ScoringEngineConfig['format'],
  counts: { player1: number; player2: number },
): boolean {
  return isBestOfFiveDecidingSet(state, format, counts)
    || isBestOfThreeDecidingSet(state, format, counts);
}
