import { logger } from '@/lib/logger';
import type { ScoringEngineConfig, ScoringState, GameScore, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { createEmptySetForFormat, getInitialGames, usesNoAd } from './format-rules';
import { shouldStartTiebreak } from './tiebreak';
import { shouldStartMatchTiebreak } from './match-tiebreak';
import { completeSet, isSetComplete } from './set-completion';

function processStandardPoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = { ...state.currentGame };

  if (winner === 'player1') game.player1++;
  else game.player2++;

  if (usesNoAd(config)) {
    if (game.player1 >= 3 && game.player2 >= 3) {
      game.isDeuce = true;
      game.player1 = 3;
      game.player2 = 3;
      state.currentGame = game;
      return handleGameWon(winner, game, state, config);
    }
    const needed = 4;
    if (game.player1 >= needed || game.player2 >= needed) {
      const gameWinner = game.player1 >= needed ? 'player1' : 'player2';
      return handleGameWon(gameWinner, game, state, config);
    }
    return { ...state, currentGame: game };
  }

  if (game.player1 === 3 && game.player2 === 3) {
    game.isDeuce = true;
    state.currentGame = game;
    return { ...state, currentGame: game };
  }

  if (game.player1 >= 4 && game.player2 < 3) {
    return handleGameWon('player1', game, state, config);
  }
  if (game.player2 >= 4 && game.player1 < 3) {
    return handleGameWon('player2', game, state, config);
  }

  if (game.player1 >= 3 && game.player2 >= 3) {
    game.isDeuce = true;
    game.player1 = 3;
    game.player2 = 3;
    state.currentGame = game;
    return { ...state, currentGame: game };
  }

  return { ...state, currentGame: game };
}

function processDeucePoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = { ...state.currentGame };

  if (game.advantage === null) {
    game.advantage = winner;
  } else if (game.advantage === winner) {
    return handleGameWon(winner, game, state, config);
  } else {
    game.advantage = null;
  }

  return { ...state, currentGame: game };
}

export function processRegularPoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = state.currentGame;
  if (game.isDeuce) return processDeucePoint(winner, state, config);
  return processStandardPoint(winner, state, config);
}

export function handleGameWon(
  gameWinner: 'player1' | 'player2',
  _finalGame: GameScore,
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length === 0 ? 0 : state.sets.length - 1;
  let currentSet = state.sets[currentSetIndex] ?? createEmptySetForFormat(config.format);

  const initGames = getInitialGames(config.format);
  if (isSetComplete(currentSet, state.setsWon, config, state.sets) && !currentSet.isTiebreak && (currentSet.player1 > initGames || currentSet.player2 > initGames)) {
    currentSet = createEmptySetForFormat(config.format);
  }

  const newSet = { ...currentSet };
  if (gameWinner === 'player1') newSet.player1++;
  else if (gameWinner === 'player2') newSet.player2++;
  else {
    logger.error('[ScoringEngine] handleGameWon: invalid gameWinner', { gameWinner, currentSet });
    throw new Error('INVALID_GAME_WINNER');
  }

  const newSets = [...state.sets];
  if (currentSet.player1 === initGames && currentSet.player2 === initGames && !currentSet.isTiebreak) {
    newSets.push(newSet);
  } else {
    newSets[currentSetIndex] = newSet;
  }

  const newServer = state.server === 'player1' ? 'player2' : 'player1';

  if (config.format === 'BEST_OF_5' &&
      state.setsWon.player1 === 2 && state.setsWon.player2 === 2 &&
      newSet.player1 === 6 && newSet.player2 === 6 && !newSet.isTiebreak) {
    newSet.isTiebreak = true;
    newSet.tiebreakScore = { player1: 0, player2: 0 };
    const setIdx = newSets.length - 1;
    newSets[setIdx] = newSet;
    state.sets = newSets;
    state.currentGame = createEmptyGame();
    state.server = newServer;
    return state;
  }

  const shouldStartMatchTb = shouldStartMatchTiebreak(state, config);
  if (shouldStartMatchTb) {
    const matchTbSet: SetScore = {
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 0, player2: 0 },
    };
    newSets.push(matchTbSet);
    state.sets = newSets;
    state.currentGame = createEmptyGame();
    state.server = newServer;
    return state;
  }

  if (shouldStartTiebreak(newSet, state, config)) {
    newSet.isTiebreak = true;
    newSet.tiebreakScore = { player1: 0, player2: 0 };
    const newSetIndex = newSets.length - 1;
    newSets[newSetIndex] = newSet;
    state.sets = newSets;
    state.currentGame = createEmptyGame();
    state.server = newServer;
    return state;
  }

  if (isSetComplete(newSet, state.setsWon, config, state.sets)) {
    return completeSet(gameWinner, newSet, newSets, newServer, state, config);
  }

  state.sets = newSets;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}