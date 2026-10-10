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
      // "No-ad": ao empatar em 3-3 (40-40), o game NÃO encerra.
      // Entra em Ponto Decisivo (Deuce) para ser decidido no próximo ponto único.
      game.isDeuce = true;
      game.player1 = 3;
      game.player2 = 3;
      return { ...state, currentGame: game };
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
  if (game.isDeuce) {
    // Em formatos "no-ad", a partir do 3-3 o game é decidido no PRÓXIMO
    // ponto (sudden death / ponto de ouro) — quem vencer esse ponto único
    // vence o game, sem precisar de 2 pontos de vantagem. O deuce
    // tradicional (processDeucePoint) só se aplica a formatos com
    // vantagem.
    if (usesNoAd(config)) return handleGameWon(winner, game, state, config);
    return processDeucePoint(winner, state, config);
  }
  return processStandardPoint(winner, state, config);
}

function validateGameWinner(gameWinner: 'player1' | 'player2', currentSet: SetScore): void {
  if (gameWinner !== 'player1' && gameWinner !== 'player2') {
    logger.error('[ScoringEngine] handleGameWon: invalid gameWinner', { gameWinner, currentSet });
    throw new Error('INVALID_GAME_WINNER');
  }
}

function resolveActiveSet(state: ScoringState, config: ScoringEngineConfig): {
  currentSet: SetScore;
  currentSetIndex: number;
  /** true quando o set ativo ainda NÃO existe em state.sets (deve ser empilhado). */
  isNewSet: boolean;
} {
  const currentSetIndex = state.sets.length === 0 ? 0 : state.sets.length - 1;
  let currentSet = state.sets[currentSetIndex] ?? createEmptySetForFormat(config.format);

  const initGames = getInitialGames(config.format);
  const setsDecided = state.setsWon.player1 + state.setsWon.player2;
  const lastSetAlreadyDecided = state.sets.length > 0 && setsDecided >= state.sets.length;
  const isPreviousComplete = isSetComplete(currentSet, state.setsWon, config, state.sets) &&
    !currentSet.isTiebreak &&
    (currentSet.player1 > initGames || currentSet.player2 > initGames);

  const isNewSet = state.sets.length === 0 || lastSetAlreadyDecided || isPreviousComplete;

  if (lastSetAlreadyDecided || isPreviousComplete) {
    currentSet = createEmptySetForFormat(config.format);
  }

  return { currentSet, currentSetIndex, isNewSet };
}

function shouldTriggerTiebreak(newSet: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  if (newSet.isTiebreak) return false;

  const isBestOf5Decider = config.format === 'BEST_OF_5' &&
    state.setsWon.player1 === 2 &&
    state.setsWon.player2 === 2 &&
    newSet.player1 === 6 &&
    newSet.player2 === 6;

  return isBestOf5Decider || shouldStartTiebreak(newSet, state, config);
}

function transitionToTiebreak(
  newSet: SetScore,
  newSets: SetScore[],
  state: ScoringState,
  newServer: 'player1' | 'player2',
): ScoringState {
  newSet.isTiebreak = true;
  newSet.tiebreakScore = { player1: 0, player2: 0 };
  newSets[newSets.length - 1] = newSet;

  state.sets = newSets;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}

function transitionToMatchTiebreak(
  state: ScoringState,
  newServer: 'player1' | 'player2',
): ScoringState {
  const matchTbSet: SetScore = {
    player1: 0,
    player2: 0,
    isTiebreak: true,
    tiebreakScore: { player1: 0, player2: 0 },
  };
  state.sets = [...state.sets, matchTbSet];
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}

export function handleGameWon(
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

  if (shouldStartMatchTiebreak(state, config)) {
    return transitionToMatchTiebreak(state, newServer);
  }

  const initGames = getInitialGames(config.format);
  const newSets = [...state.sets];
  // Formatos com placar inicial (Sets Curtos 2/2): o set em andamento já existe
  // em state.sets com o placar inicial (2-2) e deve ser SUBSTITUÍDO pelo novo
  // placar — só empilha quando o set ainda não existe no array. Antes, o 2-2
  // inicial era confundido com "set novo" e empilhado, gerando um set fantasma
  // 2-2 e deslocando todas as checagens baseadas em sets.length.
  // Demais formatos (início em 0-0) mantêm a regra original.
  const startsNewSet = initGames > 0
    ? isNewSet
    : currentSet.player1 === 0 && currentSet.player2 === 0 && !currentSet.isTiebreak;
  if (startsNewSet) {
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