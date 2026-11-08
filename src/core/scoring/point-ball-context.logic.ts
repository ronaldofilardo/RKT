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

/**
 * Retorna true quando o set em disputa é um Match Tiebreak decisivo de 10 pontos.
 * Cobre todos os formatos: MATCH_TB_10 (sempre), BEST_OF_3_MATCH_TB / SHORT_SET_2V2_NO_AD /
 * BEST_OF_3_NO_AD (3º set) e BEST_OF_5 (5º set).
 */
function isMatchTiebreakSet(format: TennisFormat | undefined, sets: { isTiebreak?: boolean }[]): boolean {
  if (!format) return false;
  if (format === 'MATCH_TB_10') return true;
  const setCount = sets.length;
  if (
    (format === 'BEST_OF_3_MATCH_TB' ||
      format === 'SHORT_SET_2V2_NO_AD' ||
      format === 'BEST_OF_3_NO_AD') &&
    setCount === 3
  ) return true;
  if (format === 'BEST_OF_5' && setCount === 5) return true;
  return false;
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
    // Match Tiebreak decisivo de 10 pontos para todos os formatos que o possuem.
    const target = isMatchTiebreakSet(format, sets) ? 10 : 7;
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

/**
 * Bug 4 — isSetBall precisa respeitar o limiar do formato.
 * PRO_SET_8: set encerra em 8 games → set ball a partir de 7 (com adversário ≤ 6).
 * Demais formatos: 6 games → set ball a partir de 5 (com adversário ≤ 4).
 */
export function isSetBall(state: ScoringState, setNumber: number, format?: TennisFormat): boolean {
  if (!state) return false;
  const set = state.sets?.[setNumber - 1];
  if (!set) return false;
  const target = format === 'PRO_SET_8' ? 8 : 6;
  const threshold = target - 1; // 7 para PRO_SET_8, 5 para os demais
  const margin = target - 2;    // 6 para PRO_SET_8, 4 para os demais
  return (set.player1 >= threshold && set.player2 <= margin) ||
         (set.player2 >= threshold && set.player1 <= margin);
}
