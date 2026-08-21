import type { TennisFormat } from '@/core/scoring/types';
import { formatPointValue, getSinglePointValue } from './match-card-utils.helpers';
// Re-exporta a versão unificada do normalizer (bug #4, 2026-08-07).
// Mantemos a assinatura pública deste módulo para não quebrar importadores
// existentes, mas a implementação agora delega para src/core/scoring/score-normalizer
// (que cobre também BEST_OF_5, BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD).
import {
  normalizeScoreState as normalizeScoreStateUnified,
  isMatchTiebreakSetIndex,
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
  const p1 = formatPointValue(pts1, currentGame.advantage === 'player1');
  const p2 = formatPointValue(pts2, currentGame.advantage === 'player2');
  return `${p1}-${p2}`;
}

export function getSinglePointDisplay(
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined,
  player: 'player1' | 'player2',
): string {
  return getSinglePointValue(currentGame, player);
}

export function getLastSetPointDisplay(
  sets: Array<{ player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null }> | undefined,
  player: 'player1' | 'player2',
): string {
  if (!sets || sets.length === 0) return '-';
  const last = sets[sets.length - 1];
  if (last.isTiebreak && last.tiebreakScore) {
    return String(last.tiebreakScore[player] ?? 0);
  }
  return String(last[player] ?? 0);
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

export function isCurrentSetMatchTiebreak(
  sets: Array<{ player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null }>,
  format: TennisFormat,
): boolean {
  if (sets.length === 0) return false;
  if (!isMatchTiebreakFormat(format)) return false;

  const lastSetIndex = sets.length - 1;
  let p1Won = 0;
  let p2Won = 0;
  for (let i = 0; i < lastSetIndex; i++) {
    const s = sets[i];
    if (s.isTiebreak && s.tiebreakScore) {
      if (s.tiebreakScore.player1 > s.tiebreakScore.player2) p1Won++;
      else if (s.tiebreakScore.player2 > s.tiebreakScore.player1) p2Won++;
    } else {
      if (s.player1 > s.player2) p1Won++;
      else if (s.player2 > s.player1) p2Won++;
    }
  }
  return isMatchTiebreakSetIndex(lastSetIndex, sets.length, format, { p1Won, p2Won });
}