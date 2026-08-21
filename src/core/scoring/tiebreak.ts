import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { completeSetWithTiebreak } from './set-completion';
import {
  addTiebreakPoint,
  getNextTiebreakServer,
  getTiebreakMinimum,
  getTiebreakScore,
  getTiebreakWinner,
  shouldStartTiebreak as shouldStartTiebreakHelper,
} from './tiebreak.helpers';

export function processTiebreakPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const newTb = addTiebreakPoint(getTiebreakScore(currentSet), winner);
  const total = newTb.player1 + newTb.player2;
  const newServer = getNextTiebreakServer(state.server, total);
  const minimum = getTiebreakMinimum(config, state.sets.length);
  const tiebreakWinner = getTiebreakWinner(newTb, minimum);

  if (tiebreakWinner) {
    return completeSetWithTiebreak(tiebreakWinner, newTb, newServer, state, config);
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
  return shouldStartTiebreakHelper(set, state, config);
}