import { GAME_POINTS } from '@/core/scoring/point.logic';
import type { ScoreState } from './player-card.types';

export function formatScore(state: ScoreState | null, side: 'player1' | 'player2'): string {
  if (!state) return '0';
  const game = state.currentGame;
  const set = state.sets[state.sets.length - 1];

  if (set?.isTiebreak && set.tiebreakScore) {
    return String(side === 'player1' ? set.tiebreakScore.player1 : set.tiebreakScore.player2);
  }

  // Partida encerrada: não há game em andamento (também protege partidas
  // antigas, salvas com o último game "preso" no scoreState, ex.: 40-15).
  if (state.isFinished) return '-';

  if (game.isDeuce) {
    if (game.advantage === side) return 'ADV';
    if (game.advantage !== null) return '40';
    return '40';
  }

  return GAME_POINTS[game[side]] ?? '0';
}

export function getGameProgress(state: ScoreState | null, side: 'player1' | 'player2'): number {
  if (!state) return 0;
  const game = state.currentGame;
  const set = state.sets[state.sets.length - 1];

  if (set?.isTiebreak && set.tiebreakScore) {
    const pts = side === 'player1' ? set.tiebreakScore.player1 : set.tiebreakScore.player2;
    return Math.min(pts / 7, 1);
  }

  if (state.isFinished) return 0;

  if (game.isDeuce) {
    if (game.advantage === side) return 1;
    return 0.75;
  }

  return Math.min(game[side] / 4, 1);
}
