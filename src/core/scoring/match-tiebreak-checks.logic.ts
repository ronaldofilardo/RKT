import type { ScoringEngineConfig, ScoringState } from './types';

export function shouldStartMatchTiebreak(state: ScoringState, config: ScoringEngineConfig): boolean {
  if (
    config.format === 'BEST_OF_3_MATCH_TB' ||
    config.format === 'BEST_OF_3_NO_AD' ||
    config.format === 'SHORT_SET_2V2_NO_AD'
  ) {
    const setsWon = state.setsWon;
    if (setsWon.player1 === 1 && setsWon.player2 === 1 && state.sets.length === 2) {
      return true;
    }
  }

  return false;
}

export function isMatchTiebreakActive(state: ScoringState, config: ScoringEngineConfig): boolean {
  const format = config.format;
  const currentSetNum = state.sets.length;
  const p1Sets = state.sets.filter(s => !s.isTiebreak && s.player1 > s.player2).length;
  const p2Sets = state.sets.filter(s => !s.isTiebreak && s.player2 > s.player1).length;

  if (format === 'MATCH_TB_10') return true;

  if (format === 'BEST_OF_5' && currentSetNum === 5 && p1Sets === 2 && p2Sets === 2) {
    const fifthSet = state.sets[4];
    return fifthSet?.isTiebreak === true;
  }

  if ((format === 'BEST_OF_3_MATCH_TB' || format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD') &&
      currentSetNum === 3 && p1Sets === 1 && p2Sets === 1) {
    return true;
  }

  return false;
}
