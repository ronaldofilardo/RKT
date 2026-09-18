import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { getSetsToWin, usesNoAd, isFinalSet, getGamesToTiebreak } from './format-rules';

const DECISIVE_MATCH_TB_FORMATS = new Set([
  'BEST_OF_3_MATCH_TB',
  'BEST_OF_3_NO_AD',
  'SHORT_SET_2V2_NO_AD',
]);

function isMatchTiebreakSet(format: string, setsCount: number): boolean {
  if (format === 'MATCH_TB_10') return true;
  if (setsCount === 5 && format === 'BEST_OF_5') return true;
  if (setsCount === 3) {
    return DECISIVE_MATCH_TB_FORMATS.has(format);
  }
  return false;
}

function isTiebreakComplete(
  tb: { player1: number; player2: number },
  format: string,
  setsCount: number,
): boolean {
  const tbMax = Math.max(tb.player1, tb.player2);
  const tbDiff = Math.abs(tb.player1 - tb.player2);
  const tbMin = isMatchTiebreakSet(format, setsCount) ? 10 : 7;
  return tbMax >= tbMin && tbDiff >= 2;
}

function getRequiredGamesToWinSet(config: ScoringEngineConfig): number {
  if (usesNoAd(config)) {
    return config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
  }
  if (isFinalSet(config)) {
    return config.format === 'PRO_SET_8' ? 8 : getGamesToTiebreak(config);
  }
  return 6;
}

function getMatchWinner(
  setsWon: { player1: number; player2: number },
  setsToWin: number,
): 'player1' | 'player2' | null {
  if (setsWon.player1 >= setsToWin) return 'player1';
  if (setsWon.player2 >= setsToWin) return 'player2';
  return null;
}

function createMatchTiebreakSet(): SetScore {
  return {
    player1: 0,
    player2: 0,
    isTiebreak: true,
    tiebreakScore: { player1: 0, player2: 0 },
  };
}

export function completeSet(
  setWinner: 'player1' | 'player2',
  _finalSet: SetScore,
  newSets: SetScore[],
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const setsWon = {
    ...state.setsWon,
    [setWinner]: state.setsWon[setWinner] + 1,
  };

  const setsToWin = DECISIVE_MATCH_TB_FORMATS.has(config.format) ? 2 : getSetsToWin(config);
  const matchWinner = getMatchWinner(setsWon, setsToWin);

  state.sets = newSets;
  state.setsWon = setsWon;
  state.server = newServer;

  if (matchWinner) {
    state.isFinished = true;
    state.winner = matchWinner;
    return state;
  }

  if (DECISIVE_MATCH_TB_FORMATS.has(config.format) && setsWon.player1 === 1 && setsWon.player2 === 1) {
    newSets.push(createMatchTiebreakSet());
  }

  state.currentGame = createEmptyGame();
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
  if (set.isTiebreak && set.tiebreakScore) {
    return isTiebreakComplete(set.tiebreakScore, config.format, sets.length);
  }

  const diff = Math.abs(set.player1 - set.player2);
  const maxGames = Math.max(set.player1, set.player2);
  const needed = getRequiredGamesToWinSet(config);

  return maxGames >= needed && diff >= 2;
}