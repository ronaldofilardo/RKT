import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { getGamesToTiebreak, isFinalSet, usesNoAd } from './format-rules';

export type TiebreakScore = { player1: number; player2: number };

export function getTiebreakScore(set: SetScore | undefined): TiebreakScore {
  return set?.tiebreakScore ?? { player1: 0, player2: 0 };
}

export function addTiebreakPoint(score: TiebreakScore, winner: 'player1' | 'player2'): TiebreakScore {
  return winner === 'player1'
    ? { ...score, player1: score.player1 + 1 }
    : { ...score, player2: score.player2 + 1 };
}

export function getNextTiebreakServer(server: ScoringState['server'], totalPoints: number): ScoringState['server'] {
  if (totalPoints % 2 === 0) return server;
  return server === 'player1' ? 'player2' : 'player1';
}

export function isMatchTiebreak(config: ScoringEngineConfig, setCount: number): boolean {
  return config.format === 'MATCH_TB_10'
    || (config.format === 'BEST_OF_5' && setCount === 5)
    || (config.format === 'BEST_OF_3_MATCH_TB' && setCount === 3)
    || (config.format === 'BEST_OF_3_NO_AD' && setCount === 3)
    || (config.format === 'SHORT_SET_2V2_NO_AD' && setCount === 3);
}

export function getTiebreakMinimum(config: ScoringEngineConfig, setCount: number): number {
  return isMatchTiebreak(config, setCount) ? 10 : 7;
}

export function getTiebreakWinner(score: TiebreakScore, minimum: number): 'player1' | 'player2' | null {
  if (score.player1 >= minimum && score.player1 - score.player2 >= 2) return 'player1';
  if (score.player2 >= minimum && score.player2 - score.player1 >= 2) return 'player2';
  return null;
}

function isDecidingBestOfFive(state: ScoringState): boolean {
  return state.setsWon.player1 === 2 && state.setsWon.player2 === 2;
}

function isDecidingBestOfThree(state: ScoringState): boolean {
  return state.sets.length >= 2 && state.setsWon.player1 === 1 && state.setsWon.player2 === 1;
}

function shouldSkipStandardTiebreak(state: ScoringState, config: ScoringEngineConfig): boolean {
  if (config.format === 'BEST_OF_5') return isDecidingBestOfFive(state);
  if (config.format === 'BEST_OF_3' || config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD') {
    return isDecidingBestOfThree(state);
  }
  return false;
}

function isAllSquare(set: SetScore, games: number): boolean {
  return set.player1 === games && set.player2 === games;
}

export function shouldStartTiebreak(set: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  if (usesNoAd(config)) return isAllSquare(set, 4);
  if (isFinalSet(config)) return isAllSquare(set, getGamesToTiebreak(config));
  if (shouldSkipStandardTiebreak(state, config)) return false;
  return isAllSquare(set, 6);
}
