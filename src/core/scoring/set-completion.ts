import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { getSetsToWin, usesNoAd, isFinalSet, getGamesToTiebreak } from './format-rules';

export function completeSet(
  setWinner: 'player1' | 'player2',
  _finalSet: SetScore,
  newSets: SetScore[],
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const setsWon = { ...state.setsWon };
  if (setWinner === 'player1') setsWon.player1++;
  else setsWon.player2++;

  const setsToWin = getSetsToWin(config);

  if (config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD' || config.format === 'SHORT_SET_2V2_NO_AD') {
    if (setsWon.player1 >= 2) {
      state.sets = newSets;
      state.setsWon = setsWon;
      state.isFinished = true;
      state.winner = 'player1';
      state.server = newServer;
      return state;
    }
    if (setsWon.player2 >= 2) {
      state.sets = newSets;
      state.setsWon = setsWon;
      state.isFinished = true;
      state.winner = 'player2';
      state.server = newServer;
      return state;
    }
    if (setsWon.player1 === 1 && setsWon.player2 === 1) {
      const matchTbSet: SetScore = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 0, player2: 0 },
      };
      newSets.push(matchTbSet);
      state.sets = newSets;
      state.setsWon = setsWon;
      state.currentGame = createEmptyGame();
      state.server = newServer;
      return state;
    }
  }

  if (setsWon.player1 >= setsToWin) {
    state.sets = newSets;
    state.setsWon = setsWon;
    state.isFinished = true;
    state.winner = 'player1';
    state.server = newServer;
    return state;
  }
  if (setsWon.player2 >= setsToWin) {
    state.sets = newSets;
    state.setsWon = setsWon;
    state.isFinished = true;
    state.winner = 'player2';
    state.server = newServer;
    return state;
  }

  state.sets = newSets;
  state.setsWon = setsWon;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
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
  const diff = Math.abs(set.player1 - set.player2);
  const maxGames = Math.max(set.player1, set.player2);

  if (set.isTiebreak && set.tiebreakScore) {
    const tb = set.tiebreakScore;
    const tbMax = Math.max(tb.player1, tb.player2);
    const tbDiff = Math.abs(tb.player1 - tb.player2);
    const isMatchTb = config.format === 'MATCH_TB_10' ||
      (config.format === 'BEST_OF_5' && sets.length === 5) ||
      (config.format === 'BEST_OF_3_MATCH_TB' && sets.length === 3) ||
      (config.format === 'BEST_OF_3_NO_AD' && sets.length === 3) ||
      (config.format === 'SHORT_SET_2V2_NO_AD' && sets.length === 3);
    const tbMin = isMatchTb ? 10 : 7;
    return tbMax >= tbMin && tbDiff >= 2;
  }

  if (usesNoAd(config)) {
    const needed = config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
    return maxGames >= needed && diff >= 2;
  }

  if (isFinalSet(config)) {
    const needed = getGamesToTiebreak(config);
    if (config.format === 'PRO_SET_8') {
      return maxGames >= 8 && diff >= 2;
    }
    return maxGames >= needed && diff >= 2;
  }

  if (config.format === 'BEST_OF_3') {
    return maxGames >= 6 && diff >= 2;
  }

  return maxGames >= 6 && diff >= 2;
}