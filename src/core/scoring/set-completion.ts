import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { getSetsToWin } from './format-rules';
import { incrementSetsWon, finishMatch, startMatchTiebreak, continueAfterSet, isShortMatchFormat, isTiebreakComplete, hasWonRegularSet } from './set-completion.helpers';

export function completeSet(
  setWinner: 'player1' | 'player2',
  _finalSet: SetScore,
  newSets: SetScore[],
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const setsWon = incrementSetsWon(setWinner, state);
  const setsToWin = config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD' || config.format === 'SHORT_SET_2V2_NO_AD' ? 2 : getSetsToWin(config);
  if (setsWon.player1 >= setsToWin) return finishMatch(state, newSets, setsWon, 'player1', newServer);
  if (setsWon.player2 >= setsToWin) return finishMatch(state, newSets, setsWon, 'player2', newServer);
  if (isShortMatchFormat(config) && setsWon.player1 === 1 && setsWon.player2 === 1) return startMatchTiebreak(state, newSets, setsWon, newServer);
  return continueAfterSet(state, newSets, setsWon, newServer);
}

export function completeSetWithTiebreak(
  setWinner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const newSet: SetScore = {
    ...currentSet,
    player1: setWinner === 'player1' ? currentSet.player1 + 1 : currentSet.player1,
    player2: setWinner === 'player2' ? currentSet.player2 + 1 : currentSet.player2,
    isTiebreak: false,
    tiebreakScore: tbScore,
  };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;
  return completeSet(setWinner, newSet, newSets, newServer, state, config);
}

export function isSetComplete(
  set: SetScore,
  _setsWon: { player1: number; player2: number },
  config: ScoringEngineConfig,
  sets: SetScore[],
): boolean {
  return isTiebreakComplete(set, config, sets) || hasWonRegularSet(set, config);
}

