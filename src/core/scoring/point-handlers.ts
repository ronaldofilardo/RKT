import type { ScoringState, GameScore, SetScore } from './types';

export function processStandardPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  format: string
): ScoringState {
  const game = { ...state.currentGame };

  if (winner === 'player1') game.player1++;
  else game.player2++;

  if (usesNoAd(format)) {
    if (game.player1 >= 3 && game.player2 >= 3) {
      game.isDeuce = true;
      game.player1 = 3;
      game.player2 = 3;
      state.currentGame = game;
      return handleGameWon(state, winner, game, format);
    }
    const needed = 4;
    if (game.player1 >= needed || game.player2 >= needed) {
      const gameWinner = game.player1 >= needed ? 'player1' : 'player2';
      return handleGameWon(state, gameWinner, game, format);
    }
    return { ...state, currentGame: game };
  }

  if (game.player1 === 3 && game.player2 === 3) {
    game.isDeuce = true;
    state.currentGame = game;
    return { ...state, currentGame: game };
  }

  if (game.player1 >= 4 && game.player2 < 3) {
    return handleGameWon(state, 'player1', game, format);
  }
  if (game.player2 >= 4 && game.player1 < 3) {
    return handleGameWon(state, 'player2', game, format);
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

export function processDeucePoint(
  state: ScoringState,
  winner: 'player1' | 'player2'
): ScoringState {
  const game = { ...state.currentGame };

  if (game.advantage === null) {
    game.advantage = winner;
  } else if (game.advantage === winner) {
    return handleGameWon(state, winner, game, '');
  } else {
    game.advantage = null;
  }

  return { ...state, currentGame: game };
}

export function processTiebreakPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  format: string
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

  // Match tiebreak (10 pts) vs Set tiebreak (7 pts)
  const isMatchTb = format === 'MATCH_TB_10' ||
    (format === 'BEST_OF_5' && state.sets.length === 5) ||
    (format === 'BEST_OF_3_MATCH_TB' && state.sets.length === 3) ||
    (format === 'SHORT_SET_2V2_NO_AD' && state.sets.length === 3);
  const tbMin = isMatchTb ? 10 : 7;

  if (newTb.player1 >= tbMin && newTb.player1 - newTb.player2 >= 2) {
    return completeSetWithTiebreak(state, 'player1', newTb, newServer);
  }
  if (newTb.player2 >= tbMin && newTb.player2 - newTb.player1 >= 2) {
    return completeSetWithTiebreak(state, 'player2', newTb, newServer);
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

export function processMatchTiebreak(
  state: ScoringState,
  winner: 'player1' | 'player2'
): ScoringState {
  let set = state.sets[0];
  if (!set) {
    set = { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } };
  }

  const tb = set.tiebreakScore ?? { player1: 0, player2: 0 };
  const newTb = { ...tb };
  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  if ((newTb.player1 >= 10 || newTb.player2 >= 10) && Math.abs(newTb.player1 - newTb.player2) >= 2) {
    return completeMatchTiebreak(state, winner, newTb, newServer);
  }

  const newSet: SetScore = { ...set, tiebreakScore: newTb };
  state.sets = [newSet];
  state.server = newServer;
  state.currentGame = createEmptyGame();
  return state;
}

function handleGameWon(
  state: ScoringState,
  gameWinner: 'player1' | 'player2',
  finalGame: GameScore,
  format: string
): ScoringState {
  const currentSetIndex = state.sets.length === 0 ? 0 : state.sets.length - 1;
  let currentSet = state.sets[currentSetIndex] ?? createEmptySet();

  if (isSetComplete(currentSet, state.setsWon, format, state.sets.length)) {
    currentSet = createEmptySet();
  }

  const newSet = { ...currentSet };
  if (gameWinner === 'player1') newSet.player1++;
  else if (gameWinner === 'player2') newSet.player2++;

  const newSets = [...state.sets];
  if (currentSet.player1 === 0 && currentSet.player2 === 0 && !currentSet.isTiebreak) {
    newSets.push(newSet);
  } else {
    newSets[currentSetIndex] = newSet;
  }

  const newServer = state.server === 'player1' ? 'player2' : 'player1';

  if (shouldStartTiebreak(newSet, format, state.setsWon, state.sets.length)) {
    newSet.isTiebreak = true;
    newSet.tiebreakScore = { player1: 0, player2: 0 };
    const newSetIndex = newSets.length - 1;
    newSets[newSetIndex] = newSet;
    return {
      ...state,
      sets: newSets,
      currentGame: createEmptyGame(),
      server: newServer,
    };
  }

  if (isSetComplete(newSet, state.setsWon, format, state.sets.length)) {
    return completeSet(state, gameWinner, newSet, newSets, newServer, format);
  }

  return {
    ...state,
    sets: newSets,
    currentGame: createEmptyGame(),
    server: newServer,
  };
}

function completeSet(
  state: ScoringState,
  setWinner: 'player1' | 'player2',
  finalSet: SetScore,
  newSets: SetScore[],
  newServer: 'player1' | 'player2',
  format: string
): ScoringState {
  const setsWon = { ...state.setsWon };
  if (setWinner === 'player1') setsWon.player1++;
  else setsWon.player2++;

  const setsToWin = getSetsToWin(format);

  if (format === 'BEST_OF_3_MATCH_TB') {
    if (setsWon.player1 >= 2) {
      return finishMatch(state, newSets, setsWon, 'player1', newServer);
    }
    if (setsWon.player2 >= 2) {
      return finishMatch(state, newSets, setsWon, 'player2', newServer);
    }
    if (setsWon.player1 === 1 && setsWon.player2 === 1) {
      return {
        ...state,
        sets: newSets,
        setsWon,
        currentGame: createEmptyGame(),
        server: newServer,
      };
    }
  }

  if (setsWon.player1 >= setsToWin) {
    return finishMatch(state, newSets, setsWon, 'player1', newServer);
  }
  if (setsWon.player2 >= setsToWin) {
    return finishMatch(state, newSets, setsWon, 'player2', newServer);
  }

  return {
    ...state,
    sets: newSets,
    setsWon,
    currentGame: createEmptyGame(),
    server: newServer,
  };
}

function completeSetWithTiebreak(
  state: ScoringState,
  setWinner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2'
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
  return completeSet(state, setWinner, newSet, newSets, newServer, state.sets.length > 0 ? state.sets[0].isTiebreak ? '' : '' : '');
}

function completeMatchTiebreak(
  state: ScoringState,
  winner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2'
): ScoringState {
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

function finishMatch(
  state: ScoringState,
  sets: SetScore[],
  setsWon: { player1: number; player2: number },
  winner: 'player1' | 'player2',
  newServer: 'player1' | 'player2'
): ScoringState {
  state.sets = sets;
  state.setsWon = setsWon;
  state.isFinished = true;
  state.winner = winner;
  state.server = newServer;
  return state;
}

function shouldStartTiebreak(
  set: SetScore,
  format: string,
  setsWon: { player1: number; player2: number },
  totalSets: number
): boolean {
  const noAd = usesNoAd(format);
  const isFinalSet = format === 'PRO_SET_8';

  if (noAd) return set.player1 === 4 && set.player2 === 4;
  
  if (isFinalSet) {
    // PRO_SET_8: em 8/8 não inicia TB, deixa ir a 9
    if (set.player1 === 8 && set.player2 === 8) {
      return false;
    }
    const games = format === 'PRO_SET_8' ? 8 : 6;
    return set.player1 === games && set.player2 === games;
  }
  
  // BEST_OF_5: 5º set tem MT em 6/6
  if (format === 'BEST_OF_5') {
    if (totalSets >= 4 && setsWon.player1 === 2 && setsWon.player2 === 2) {
      return set.player1 === 6 && set.player2 === 6; // MT no 5º set
    }
    return set.player1 === 6 && set.player2 === 6; // TB regular sets 1-4
  }
  
  // BEST_OF_3: 3º set NÃO tem tiebreak
  if (format === 'BEST_OF_3') {
    if (totalSets >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }
  
  // BEST_OF_3_MATCH_TB: 3º set NÃO inicia TB regular
  if (format === 'BEST_OF_3_MATCH_TB') {
    if (totalSets >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }
  
  return set.player1 === 6 && set.player2 === 6;
}

function isSetComplete(
  set: SetScore,
  setsWon: { player1: number; player2: number },
  format: string,
  totalSets: number
): boolean {
  const diff = Math.abs(set.player1 - set.player2);
  const maxGames = Math.max(set.player1, set.player2);

  // Tiebreak completando
  if (set.isTiebreak && set.tiebreakScore) {
    const tb = set.tiebreakScore;
    const tbMax = Math.max(tb.player1, tb.player2);
    const tbDiff = Math.abs(tb.player1 - tb.player2);
    // Match tiebreak (10 pts) vs Set tiebreak (7 pts)
    const isMatchTb = format === 'MATCH_TB_10' ||
      (format === 'BEST_OF_5' && totalSets === 5) ||
      (format === 'BEST_OF_3_MATCH_TB' && totalSets === 3) ||
      (format === 'SHORT_SET_2V2_NO_AD' && totalSets === 3);
    const tbMin = isMatchTb ? 10 : 7;
    return tbMax >= tbMin && tbDiff >= 2;
  }

  if (usesNoAd(format)) {
    const needed = format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
    return maxGames >= needed && diff >= 2;
  }

  if (format === 'PRO_SET_8') {
    // Completa em 9 games (8/8 continua)
    return maxGames >= 9 && diff >= 2;
  }

  if (format === 'BEST_OF_5') {
    // 5º set não completa como set regular (tem MT)
    if (totalSets >= 4 && setsWon.player1 === 2 && setsWon.player2 === 2) {
      return false;
    }
    const needed = 6;
    return maxGames >= needed && diff >= 2;
  }

  if (format === 'BEST_OF_3') {
    // 3º set completa normal (sem TB)
    if (totalSets >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return maxGames >= 6 && diff >= 2;
    }
    return maxGames >= 6 && diff >= 2;
  }

  if (maxGames === 6 && diff >= 2) return true;
  if (maxGames > 6 && diff >= 2) return true;
  return false;
}

function usesNoAd(format: string): boolean {
  return format === 'SHORT_SET_2V2_NO_AD';
}

function getSetsToWin(format: string): number {
  switch (format) {
    case 'BEST_OF_5': return 3;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'SHORT_SET_2V2_NO_AD':
      return 2;
    case 'MATCH_TB_10':
    case 'PRO_SET_8':
      return 1;
    default: return 2;
  }
}

function createEmptySet(): SetScore {
  return { player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null };
}

function createEmptyGame(): GameScore {
  return { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false };
}