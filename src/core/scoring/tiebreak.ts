import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { completeSetWithTiebreak } from './set-completion';
import { usesNoAd, isFinalSet, getGamesToTiebreak } from './format-rules';

export function processTiebreakPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const tb = currentSet?.tiebreakScore ?? { player1: 0, player2: 0 };
  const newTb = { ...tb };

  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  const isMatchTb = config.format === 'MATCH_TB_10' ||
    (config.format === 'BEST_OF_5' && state.sets.length === 5) ||
    (config.format === 'BEST_OF_3_MATCH_TB' && state.sets.length === 3) ||
    (config.format === 'BEST_OF_3_NO_AD' && state.sets.length === 3) ||
    (config.format === 'SHORT_SET_2V2_NO_AD' && state.sets.length === 3);
  const tbMin = isMatchTb ? 10 : 7;

  if (newTb.player1 >= tbMin && newTb.player1 - newTb.player2 >= 2) {
    return completeSetWithTiebreak('player1', newTb, newServer, state, config);
  }
  if (newTb.player2 >= tbMin && newTb.player2 - newTb.player1 >= 2) {
    return completeSetWithTiebreak('player2', newTb, newServer, state, config);
  }

  const newSet: SetScore = { ...currentSet, tiebreakScore: newTb };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;

  return {
    ...state,
    sets: newSets,
    currentGame: createEmptyGame(),
    server: newServer,
  };
}

export function shouldStartTiebreak(set: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  const noAd = usesNoAd(config);
  const isFinalSet_ = isFinalSet(config);

  if (noAd) return set.player1 === 4 && set.player2 === 4;

  if (isFinalSet_) {
    const games = getGamesToTiebreak(config);
    return set.player1 === games && set.player2 === games;
  }

  if (config.format === 'BEST_OF_5') {
    const setsWon = state.setsWon;
    if (setsWon.player1 === 2 && setsWon.player2 === 2) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }

  if (config.format === 'BEST_OF_3') {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }

  if (config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD') {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }

  return set.player1 === 6 && set.player2 === 6;
}