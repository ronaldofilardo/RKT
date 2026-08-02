import type { TennisFormat, ScoringEngineConfig, ScoringState, SetScore, GameScore } from './types';
import { logger } from '@/lib/logger';
import { createEmptySet, createEmptyGame } from './engine.state';

function getInitialGames(format: TennisFormat): number {
  return format === 'SHORT_SET_2V2_NO_AD' ? 2 : 0;
}

function createEmptySetForFormat(format: TennisFormat): SetScore {
  const s = createEmptySet();
  const init = getInitialGames(format);
  s.player1 = init;
  s.player2 = init;
  return s;
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

export function processMatchTiebreak(
  winner: 'player1' | 'player2',
  state: ScoringState,
): ScoringState {
  if (state.sets.length === 0) {
    state.sets.push({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });
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
  // Para formatos onde o MT é o único set (MATCH_TB_10), basta substituir.
  // Para BO5 / BO3_MATCH_TB, preservamos os sets anteriores e atualizamos
  // apenas o último (MT) marcando-o como completo e incrementando setsWon.
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

export function handleGameWon(
  gameWinner: 'player1' | 'player2',
  _finalGame: GameScore,
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length === 0 ? 0 : state.sets.length - 1;
  let currentSet = state.sets[currentSetIndex] ?? createEmptySetForFormat(config.format);

  if (isSetComplete(currentSet, state.setsWon, config, state.sets) && !currentSet.isTiebreak && (currentSet.player1 > 0 || currentSet.player2 > 0)) {
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
  const initGames = getInitialGames(config.format);
  if (currentSet.player1 === initGames && currentSet.player2 === initGames && !currentSet.isTiebreak) {
    newSets.push(newSet);
  } else {
    newSets[currentSetIndex] = newSet;
  }

  const newServer = state.server === 'player1' ? 'player2' : 'player1';

  // BEST_OF_5: 5º set at 6-6 → convert to Match Tiebreak instead of regular tiebreak
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

export function processTiebreakPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const tb = currentSet?.tiebreakScore ?? { player1: 0, player2: 0 };
  const newTb = { ...tb };

  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  const isMatchTb = config.format === 'MATCH_TB_10' ||
    (config.format === 'BEST_OF_5' && state.sets.length === 5) ||
    (config.format === 'BEST_OF_3_MATCH_TB' && state.sets.length === 3) ||
    (config.format === 'BEST_OF_3_NO_AD' && state.sets.length === 3) ||
    (config.format === 'SHORT_SET_2V2_NO_AD' && state.sets.length === 3);
  const tbMin = isMatchTb ? 10 : 7;

  if (newTb.player1 >= tbMin && newTb.player1 - newTb.player2 >= 2) {
    return completeSetWithTiebreak('player1', newTb, newServer, state, config);
  }
  if (newTb.player2 >= tbMin && newTb.player2 - newTb.player1 >= 2) {
    return completeSetWithTiebreak('player2', newTb, newServer, state, config);
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
  const noAd = usesNoAd(config);
  const isFinalSet_ = isFinalSet(config);

  if (noAd) return set.player1 === 4 && set.player2 === 4;
  
  if (isFinalSet_) {
    const games = getGamesToTiebreak(config);
    return set.player1 === games && set.player2 === games;
  }
  
  if (config.format === 'BEST_OF_5') {
    const setsWon = state.setsWon;
    if (setsWon.player1 === 2 && setsWon.player2 === 2) {
      return false; // 5th set: no regular tiebreak; MT handles 6-6
    }
    return set.player1 === 6 && set.player2 === 6;
  }
  
  if (config.format === 'BEST_OF_3') {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }
  
  if (config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD') {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }
  
  return set.player1 === 6 && set.player2 === 6;
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
  
  // BEST_OF_5 5th set MT is handled directly in handleGameWon at 6-6 games
  
  return false;
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

export function getSetsToWin(config: ScoringEngineConfig): number {
  switch (config.format) {
    case 'BEST_OF_5': return 3;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'SHORT_SET_2V2_NO_AD':
    case 'BEST_OF_3_NO_AD':
      return 2;
    case 'MATCH_TB_10':
    case 'PRO_SET_8':
      return 1;
  }
}

export function usesNoAd(config: ScoringEngineConfig): boolean {
  return config.format === 'SHORT_SET_2V2_NO_AD' || config.format === 'BEST_OF_3_NO_AD';
}

export function isFinalSet(config: ScoringEngineConfig): boolean {
  return config.format === 'PRO_SET_8';
}

export function getGamesToTiebreak(config: ScoringEngineConfig): number {
  switch (config.format) {
    case 'PRO_SET_8':
      return 9;
    case 'SHORT_SET_2V2_NO_AD':
      return 4;
    default:
      return 6;
  }
}

export function isMatchTiebreakActive(state: ScoringState, config: ScoringEngineConfig): boolean {
  const format = config.format as any;
  const currentSetNum = state.sets.length;
  const p1Sets = state.sets.filter(s => !s.isTiebreak && s.player1 > s.player2).length;
  const p2Sets = state.sets.filter(s => !s.isTiebreak && s.player2 > s.player1).length;
  
  if (format === 'MATCH_TB_10') return true;
  
  // Grand Slam: 5º set — MT only active when set is in tiebreak mode (6/6 reached)
  if (format === 'BEST_OF_5' && currentSetNum === 5 && p1Sets === 2 && p2Sets === 2) {
    const fifthSet = state.sets[4];
    return fifthSet?.isTiebreak === true;
  }
  
  // Melhor de 3 com MT: 3º set quando 1x1
  if ((format === 'BEST_OF_3_MATCH_TB' || format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD') && 
      currentSetNum === 3 && p1Sets === 1 && p2Sets === 1) {
    return true;
  }
  
  return false;
}