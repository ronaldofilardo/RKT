import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';

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
  const newTb = { ...tb };
  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  if ((newTb.player1 >= 10 || newTb.player2 >= 10) && Math.abs(newTb.player1 - newTb.player2) >= 2) {
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
    const setWinnerGames = winner === 'player1' ? 1 : 0;
    const setLoserGames = winner === 'player1' ? 0 : 1;
    state.sets = [{
      player1: setWinnerGames,
      player2: setLoserGames,
      isTiebreak: true,
      tiebreakScore: tbScore,
    }];
    state.setsWon = winner === 'player1' ? { player1: 1, player2: 0 } : { player1: 0, player2: 1 };
    state.isFinished = true;
    state.winner = winner;
    state.server = newServer;
    return state;
  }

  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const completedSet: SetScore = {
    ...currentSet,
    isTiebreak: true,
    tiebreakScore: tbScore,
  };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = completedSet;

  const setsWon = { ...state.setsWon };
  if (winner === 'player1') setsWon.player1++;
  else setsWon.player2++;

  state.sets = newSets;
  state.setsWon = setsWon;
  state.isFinished = true;
  state.winner = winner;
  state.server = newServer;
  return state;
}

export function shouldStartMatchTiebreak(state: ScoringState, config: ScoringEngineConfig): boolean {
  if (config.format === 'BEST_OF_3_MATCH_TB') {
    const setsWon = state.setsWon;
    if (setsWon.player1 === 1 && setsWon.player2 === 1 && state.sets.length === 2) {
      return true;
    }
  }

  if (config.format === 'BEST_OF_3_NO_AD') {
    const setsWon = state.setsWon;
    if (setsWon.player1 === 1 && setsWon.player2 === 1 && state.sets.length === 2) {
      return true;
    }
  }

  return false;
}

export function isMatchTiebreakActive(state: ScoringState, config: ScoringEngineConfig): boolean {
  const format = config.format as any;
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