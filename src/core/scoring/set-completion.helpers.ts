import { createEmptyGame } from './engine.state';
import { usesNoAd, isFinalSet, getGamesToTiebreak } from './format-rules';
import type { ScoringEngineConfig, ScoringState, SetScore } from './types';

export function incrementSetsWon(setWinner: 'player1' | 'player2', state: ScoringState) {
  const setsWon = { ...state.setsWon };
  setsWon[setWinner]++;
  return setsWon;
}

export function finishMatch(state: ScoringState, newSets: SetScore[], setsWon: { player1: number; player2: number }, winner: 'player1' | 'player2', server: 'player1' | 'player2') {
  state.sets = newSets;
  state.setsWon = setsWon;
  state.isFinished = true;
  state.winner = winner;
  state.server = server;
  return state;
}

export function startMatchTiebreak(state: ScoringState, newSets: SetScore[], setsWon: { player1: number; player2: number }, server: 'player1' | 'player2') {
  newSets.push({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });
  state.sets = newSets;
  state.setsWon = setsWon;
  state.currentGame = createEmptyGame();
  state.server = server;
  return state;
}

export function continueAfterSet(state: ScoringState, newSets: SetScore[], setsWon: { player1: number; player2: number }, server: 'player1' | 'player2') {
  state.sets = newSets;
  state.setsWon = setsWon;
  state.currentGame = createEmptyGame();
  state.server = server;
  return state;
}

export function isShortMatchFormat(config: ScoringEngineConfig) {
  return config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD' || config.format === 'SHORT_SET_2V2_NO_AD';
}

function isMatchTiebreakFormat(config: ScoringEngineConfig, sets: SetScore[]) {
  return config.format === 'MATCH_TB_10' || (config.format === 'BEST_OF_5' && sets.length === 5) || (config.format === 'BEST_OF_3_MATCH_TB' && sets.length === 3) || (config.format === 'BEST_OF_3_NO_AD' && sets.length === 3) || (config.format === 'SHORT_SET_2V2_NO_AD' && sets.length === 3);
}

export function isTiebreakComplete(set: SetScore, config: ScoringEngineConfig, sets: SetScore[]) {
  if (!set.isTiebreak || !set.tiebreakScore) return false;
  const tb = set.tiebreakScore;
  const minimum = isMatchTiebreakFormat(config, sets) ? 10 : 7;
  return Math.max(tb.player1, tb.player2) >= minimum && Math.abs(tb.player1 - tb.player2) >= 2;
}

export function getRegularSetRequirement(config: ScoringEngineConfig) {
  if (usesNoAd(config)) return config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
  if (isFinalSet(config)) return config.format === 'PRO_SET_8' ? 8 : getGamesToTiebreak(config);
  return 6;
}

export function hasWonRegularSet(set: SetScore, config: ScoringEngineConfig) {
  const required = getRegularSetRequirement(config);
  return Math.max(set.player1, set.player2) >= required && Math.abs(set.player1 - set.player2) >= 2;
}
