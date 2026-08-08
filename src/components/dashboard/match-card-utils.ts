import type { TennisFormat } from '@/core/scoring/types';
import { GAME_POINTS } from '@/core/scoring/point-utils';
// Re-exporta a versão unificada do normalizer (bug #4, 2026-08-07).
// Mantemos a assinatura pública deste módulo para não quebrar importadores
// existentes, mas a implementação agora delega para src/core/scoring/score-normalizer
// (que cobre também BEST_OF_5, BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD).
import {
  normalizeScoreState as normalizeScoreStateUnified,
  type NormalizedScoreState as UnifiedNormalizedScoreState,
} from '@/core/scoring/score-normalizer';

export type { TennisFormat };
export type NormalizedScoreState = UnifiedNormalizedScoreState;

export function normalizeScoreState(rawScoreState: any, format?: TennisFormat): NormalizedScoreState | null {
  return normalizeScoreStateUnified(rawScoreState, format);
}

export function formatSetScore(set: {
  player1: number;
  player2: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1: number; player2: number } | null;
}): string {
  if (set.isTiebreak && set.tiebreakScore) {
    const loser = Math.min(set.tiebreakScore.player1, set.tiebreakScore.player2);
    return `${set.player1}/${set.player2}(${loser})`;
  }
  return `${set.player1}/${set.player2}`;
}

export function formatGamePoints(currentGame: {
  player1?: number | string;
  player2?: number | string;
  advantage?: 'player1' | 'player2' | null;
}): string {
  const pts1 = currentGame.player1 ?? 0;
  const pts2 = currentGame.player2 ?? 0;
  const p1 = currentGame.advantage === 'player1'
    ? 'AD'
    : (GAME_POINTS[Math.min(typeof pts1 === 'number' ? pts1 : 0, 3)] ?? String(pts1));
  const p2 = currentGame.advantage === 'player2'
    ? 'AD'
    : (GAME_POINTS[Math.min(typeof pts2 === 'number' ? pts2 : 0, 3)] ?? String(pts2));
  return `${p1}-${p2}`;
}

export function getSinglePointDisplay(
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined,
  player: 'player1' | 'player2',
): string {
  const pts = currentGame?.[player] ?? 0;
  if (currentGame?.advantage === player) return 'AD';
  return GAME_POINTS[Math.min(typeof pts === 'number' ? pts : 0, 3)];
}

export function isMatchTiebreakFormat(format: string): boolean {
  return (
    format === 'MATCH_TB_10' ||
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'BEST_OF_5' ||
    format === 'BEST_OF_3_NO_AD' ||
    format === 'SHORT_SET_2V2_NO_AD'
  );
}