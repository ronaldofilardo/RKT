import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import {
  addWinnerPoint,
  createMatchTiebreakSet,
  getNextServer,
  isMatchTiebreakComplete,
  updateCompletedMatchTiebreak,
  hasOneSetEach,
  isActiveDecidingSet,
  isMatchTiebreakStartFormat,
  countRegularSets,
} from './match-tiebreak.helpers';

export function processMatchTiebreak(
  winner: 'player1' | 'player2',
  state: ScoringState,
): ScoringState {
  if (state.sets.length === 0) {
    state.sets.push({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 0, player2: 0 },
    });
  }
  const currentSetIndex = state.sets.length - 1;
  const set = state.sets[currentSetIndex];

  const tb = set.tiebreakScore ?? { player1: 0, player2: 0 };
  const newTb = addWinnerPoint(winner, tb);
  const total = newTb.player1 + newTb.player2;
  const newServer = getNextServer(total, state.server);

  if (isMatchTiebreakComplete(newTb)) {
    return completeMatchTiebreak(winner, newTb, newServer, state);
  }

  const newSet: SetScore = { ...set, tiebreakScore: newTb };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;
  state.sets = newSets;
  state.server = newServer;
  state.currentGame = createEmptyGame();
  return state;
}

function completeMatchTiebreak(
  winner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2',
  state: ScoringState,
): ScoringState {
  if (state.sets.length <= 1) {
    state.sets = [createMatchTiebreakSet(winner, tbScore)];
    state.setsWon = winner === 'player1' ? { player1: 1, player2: 0 } : { player1: 0, player2: 1 };
    state.isFinished = true;
    state.winner = winner;
    state.server = newServer;
    return state;
  }

  return updateCompletedMatchTiebreak(state, winner, tbScore, newServer);
}

export function shouldStartMatchTiebreak(state: ScoringState, config: ScoringEngineConfig): boolean {
  return isMatchTiebreakStartFormat(config.format) && hasOneSetEach(state);
}

export function isMatchTiebreakActive(state: ScoringState, config: ScoringEngineConfig): boolean {
  const format = config.format as any;
  if (format === 'MATCH_TB_10') return true;
  return isActiveDecidingSet(state, format, countRegularSets(state));
}