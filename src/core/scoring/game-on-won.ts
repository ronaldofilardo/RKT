import type { ScoringEngineConfig, ScoringState, GameScore, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { advanceServeIndex } from './doubles';
import { shouldStartMatchTiebreak } from './match-tiebreak';
import { isSetComplete, completeSet } from './set-completion';
import {
  validateGameWinner,
  resolveActiveSet,
  shouldTriggerTiebreak,
  transitionToTiebreak,
  transitionToMatchTiebreak,
} from './game-set-transition';

export function onGameWon(
  gameWinner: 'player1' | 'player2',
  _finalGame: GameScore,
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const { currentSet, currentSetIndex, isNewSet } = resolveActiveSet(state, config);
  validateGameWinner(gameWinner, currentSet);

  const newSet: SetScore = {
    ...currentSet,
    [gameWinner]: currentSet[gameWinner] + 1,
  };

  const newServer = state.server === 'player1' ? 'player2' : 'player1';
  advanceServeIndex(state, state.server);

  if (shouldStartMatchTiebreak(state, config)) {
    return transitionToMatchTiebreak(state, newServer);
  }

  const newSets = [...state.sets];
  if (isNewSet) {
    newSets.push(newSet);
  } else {
    newSets[currentSetIndex] = newSet;
  }

  if (shouldTriggerTiebreak(newSet, state, config)) {
    return transitionToTiebreak(newSet, newSets, state, newServer);
  }

  if (isSetComplete(newSet, state.setsWon, config, state.sets)) {
    return completeSet(gameWinner, newSet, newSets, newServer, state, config);
  }

  state.sets = newSets;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}
