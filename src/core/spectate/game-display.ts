import { GAME_POINTS } from '../scoring/point.logic';

export interface RawGameState {
  player1?: number | string | null;
  player2?: number | string | null;
  isDeuce?: boolean;
  advantage?: 'player1' | 'player2' | null;
}

export interface TiebreakPoints {
  player1: number;
  player2: number;
}

function toIndex(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const upper = value.toUpperCase();
  if (upper === 'AD') return 4;
  if (upper === 'DEUCE') return 3;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 0;
  if (n === 15) return 1;
  if (n === 30) return 2;
  if (n === 40) return 3;
  return n;
}

/**
 * Converte o estado cru do game (índices 0..4 do engine) no texto que o
 * espectador vê: 0 / 15 / 30 / 40 / AD. No tie-break exibe a contagem crua.
 */
export function formatSpectatorGame(
  game: RawGameState | null | undefined,
  tiebreak?: TiebreakPoints | null,
): { player1: string; player2: string } {
  if (tiebreak) {
    return { player1: String(tiebreak.player1), player2: String(tiebreak.player2) };
  }
  if (game?.advantage === 'player1') return { player1: 'AD', player2: '40' };
  if (game?.advantage === 'player2') return { player1: '40', player2: 'AD' };
  if (game?.isDeuce) return { player1: '40', player2: '40' };

  const p1 = toIndex(game?.player1);
  const p2 = toIndex(game?.player2);

  if (p1 >= 4 || p2 >= 4) {
    if (p1 === p2) return { player1: '40', player2: '40' };
    return p1 > p2 ? { player1: 'AD', player2: '40' } : { player1: '40', player2: 'AD' };
  }
  return {
    player1: GAME_POINTS[Math.max(0, p1)] ?? '0',
    player2: GAME_POINTS[Math.max(0, p2)] ?? '0',
  };
}
