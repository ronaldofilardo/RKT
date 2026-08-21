import { logger } from '@/lib/logger';
import type { ScoringEngineConfig, ScoringState, GameScore, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { createEmptySetForFormat, getInitialGames, usesNoAd } from './format-rules';
import { shouldStartTiebreak } from './tiebreak';
import { shouldStartMatchTiebreak } from './match-tiebreak';
import { completeSet, isSetComplete } from './set-completion';

export function incrementGame(winner: 'player1' | 'player2', game: GameScore): GameScore {
  return winner === 'player1' ? { ...game, player1: game.player1 + 1 } : { ...game, player2: game.player2 + 1 };
}

export function processNoAdPoint(winner: 'player1' | 'player2', game: GameScore, state: ScoringState, config: ScoringEngineConfig, handleWon: Function): ScoringState {
  if (game.player1 >= 3 && game.player2 >= 3) return handleWon(winner, { ...game, isDeuce: true, player1: 3, player2: 3 }, state, config);
  if (game.player1 >= 4 || game.player2 >= 4) return handleWon(game.player1 >= 4 ? 'player1' : 'player2', game, state, config);
  return { ...state, currentGame: game };
}

export function processStandardGamePoint(_winner: 'player1' | 'player2', game: GameScore, state: ScoringState, config: ScoringEngineConfig, handleWon: Function): ScoringState {
  if (game.player1 === 3 && game.player2 === 3) return { ...state, currentGame: { ...game, isDeuce: true } };
  if (game.player1 >= 4 && game.player2 < 3) return handleWon('player1', game, state, config);
  if (game.player2 >= 4 && game.player1 < 3) return handleWon('player2', game, state, config);
  if (game.player1 >= 3 && game.player2 >= 3) return { ...state, currentGame: { ...game, isDeuce: true, player1: 3, player2: 3 } };
  return { ...state, currentGame: game };
}

export function getCurrentSet(state: ScoringState, config: ScoringEngineConfig) {
  const index = state.sets.length === 0 ? 0 : state.sets.length - 1;
  return { index, set: state.sets[index] ?? createEmptySetForFormat(config.format) };
}

export function resetOverscoredSet(currentSet: SetScore, state: ScoringState, config: ScoringEngineConfig): SetScore {
  const initGames = getInitialGames(config.format);
  const completed = isSetComplete(currentSet, state.setsWon, config, state.sets);
  return completed && !currentSet.isTiebreak && (currentSet.player1 > initGames || currentSet.player2 > initGames) ? createEmptySetForFormat(config.format) : currentSet;
}

export function applyGameWinner(set: SetScore, winner: 'player1' | 'player2'): SetScore {
  if (winner === 'player1') return { ...set, player1: set.player1 + 1 };
  if (winner === 'player2') return { ...set, player2: set.player2 + 1 };
  logger.error('[ScoringEngine] handleGameWon: invalid gameWinner', { gameWinner: winner, currentSet: set });
  throw new Error('INVALID_GAME_WINNER');
}

export function replaceCurrentSet(sets: SetScore[], index: number, currentSet: SetScore, newSet: SetScore, initGames: number) {
  const next = [...sets];
  return currentSet.player1 === initGames && currentSet.player2 === initGames && !currentSet.isTiebreak ? [...next, newSet] : Object.assign(next, { [index]: newSet });
}

export function startTiebreakState(state: ScoringState, sets: SetScore[], index: number, newSet: SetScore, server: 'player1' | 'player2') {
  newSet.isTiebreak = true;
  newSet.tiebreakScore = { player1: 0, player2: 0 };
  sets[index] = newSet;
  state.sets = sets;
  state.currentGame = createEmptyGame();
  state.server = server;
  return state;
}

export function startMatchTiebreakState(state: ScoringState, sets: SetScore[], server: 'player1' | 'player2') {
  sets.push({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });
  state.sets = sets;
  state.currentGame = createEmptyGame();
  state.server = server;
  return state;
}

export function isFinalSetTiebreakTrigger(state: ScoringState, set: SetScore, config: ScoringEngineConfig) {
  return config.format === 'BEST_OF_5' && state.setsWon.player1 === 2 && state.setsWon.player2 === 2 && set.player1 === 6 && set.player2 === 6 && !set.isTiebreak;
}

export function isNewTiebreak(set: SetScore, state: ScoringState, config: ScoringEngineConfig) {
  return shouldStartTiebreak(set, state, config);
}

export function isNewMatchTiebreak(state: ScoringState, config: ScoringEngineConfig) {
  return shouldStartMatchTiebreak(state, config);
}

export { completeSet, createEmptyGame, getInitialGames, usesNoAd, isSetComplete };
