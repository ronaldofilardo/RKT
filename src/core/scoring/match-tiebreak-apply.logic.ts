import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { advanceServeIndex } from './doubles';
import { completeMatchTiebreak } from './match-tiebreak-complete.logic';

export function applyMatchTiebreak(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config?: ScoringEngineConfig,
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
  const newTb = { ...tb };
  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  if ((newTb.player1 >= 10 || newTb.player2 >= 10) && Math.abs(newTb.player1 - newTb.player2) >= 2) {
    const t = newTb.player1 + newTb.player2 - 1;
    const b = Math.floor((t + 1) / 2);
    const s0: 'player1' | 'player2' = (b % 2 === 0)
      ? state.server
      : (state.server === 'player1' ? 'player2' : 'player1');
    advanceServeIndex(state, s0);
    return completeMatchTiebreak(winner, newTb, newServer, state, config);
  }

  const newSet: SetScore = { ...set, tiebreakScore: newTb };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;
  state.sets = newSets;
  state.server = newServer;
  state.currentGame = createEmptyGame();
  return state;
}
