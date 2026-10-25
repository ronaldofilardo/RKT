import type { ScoringState, TennisFormat } from './types';

export function isPointDecisiveDeuce(
  game: { player1: number; player2: number; isDeuce?: boolean },
  format?: TennisFormat,
): boolean {
  const isNoAd = format === 'BEST_OF_3_NO_AD' || format === 'SHORT_SET_2V2_NO_AD' ||
    (typeof format === 'string' && (format as string).includes('NO_AD'));
  return isNoAd && Boolean(game.isDeuce || (game.player1 >= 3 && game.player2 >= 3 && game.player1 === game.player2));
}

export function isBreakPoint(state: ScoringState, format?: TennisFormat): boolean {
  if (!state || state.isFinished) return false;
  const set = state.sets?.[state.sets.length - 1];
  if (set?.isTiebreak) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const receiver = state.server === 'player1' ? 'player2' : 'player1';
  if (isPointDecisiveDeuce(game, format)) return true;
  if (game.isDeuce) return game.advantage === receiver;
  const receiverPoints = receiver === 'player1' ? game.player1 : game.player2;
  const serverPoints = receiver === 'player1' ? game.player2 : game.player1;
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isGamePointForPlayer(
  state: ScoringState,
  player: 'player1' | 'player2',
  format?: TennisFormat,
): boolean {
  if (!state || state.isFinished) return false;
  const sets = state.sets ?? [];
  const set = sets[sets.length - 1];

  if (set?.isTiebreak) {
    const p1 = set.tiebreakScore?.player1 ?? 0;
    const p2 = set.tiebreakScore?.player2 ?? 0;
    const playerPoints = player === 'player1' ? p1 : p2;
    const oppPoints = player === 'player1' ? p2 : p1;
    const target = (format === 'MATCH_TB_10' || (format === 'BEST_OF_3_MATCH_TB' && sets.length === 3)) ? 10 : 7;
    return playerPoints >= target - 1 && playerPoints - oppPoints >= 1;
  }

  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  if (isPointDecisiveDeuce(game, format)) return true;
  if (game.isDeuce) return game.advantage === player;

  const playerPoints = player === 'player1' ? game.player1 : game.player2;
  const oppPoints = player === 'player1' ? game.player2 : game.player1;
  return playerPoints >= 3 && oppPoints <= 2;
}

export function isSetPointForPlayer(
  state: ScoringState,
  player: 'player1' | 'player2',
  setNumber: number,
  format?: TennisFormat,
): boolean {
  if (!state || !isGamePointForPlayer(state, player, format)) return false;
  const set = state.sets?.[setNumber - 1];
  if (!set) return false;
  if (set.isTiebreak) return true;

  const playerGames = player === 'player1' ? set.player1 : set.player2;
  const oppGames = player === 'player1' ? set.player2 : set.player1;
  const target = format === 'PRO_SET_8' ? 8 : (format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6);
  const nextGames = playerGames + 1;

  return (nextGames >= target && nextGames - oppGames >= 2) || (nextGames === target + 1 && oppGames === target - 1);
}

export function isGameBall(state: ScoringState, format?: TennisFormat): boolean {
  if (!state) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const set = state.sets?.[state.sets.length - 1];
  if (set?.isTiebreak && set.tiebreakScore) {
    const p1 = set.tiebreakScore.player1;
    const p2 = set.tiebreakScore.player2;
    return (p1 >= 6 && p1 - p2 >= 1) || (p2 >= 6 && p2 - p1 >= 1);
  }
  if (isPointDecisiveDeuce(game, format)) return true;
  if (game.isDeuce) return Boolean(game.advantage);
  return (game.player1 >= 3 && game.player2 <= 2) || (game.player2 >= 3 && game.player1 <= 2);
}

export function isSetBall(state: ScoringState, setNumber: number): boolean {
  if (!state) return false;
  const set = state.sets?.[setNumber - 1];
  if (!set) return false;
  return (set.player1 >= 5 && set.player2 <= 4) || (set.player2 >= 5 && set.player1 <= 4);
}
