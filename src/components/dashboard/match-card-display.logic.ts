import React, { type ReactNode } from 'react';
import { GAME_POINTS } from '@/core/scoring/point.logic';
import type { SetCellScore } from './match-card.types';

export function formatSetScore(set: SetCellScore): string {
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

/**
 * Formata o placar de um set em notação compacta alinhada para exibição no card.
 *
 * - Set normal:          "6" / "3" (games)
 * - Vencedor do tiebreak: "7" (apenas games, sem sobrescrito)
 * - Perdedor do tiebreak: 6³ (games com pontos do TB sobrescritos)
 * - Match Tiebreak:      "10" / "8" (pontuação direta de cada jogador)
 */
export function formatCompactSetScore(
  set: SetCellScore,
  player: 'player1' | 'player2',
  isDecisiveMatchTiebreak = false,
): ReactNode {
  const opponentKey = player === 'player1' ? 'player2' : 'player1';
  const opponentScore = set[opponentKey] ?? 0;

  const isMatchTb = isDecisiveMatchTiebreak || (set.player1 <= 1 && set.player2 <= 1 && !!set.tiebreakScore);

  // Match Tiebreak: ambos mostram só o placar do TB, sem sobrescrito.
  if (isMatchTb && set.tiebreakScore) {
    return String(set.tiebreakScore[player] ?? 0);
  }

  const gameScore = set[player] ?? 0;
  if (!set.tiebreakScore) {
    return String(gameScore);
  }

  // Set com tiebreak: vencedor mostra só os games; perdedor mostra games + pontos do TB em sobrescrito.
  const tbScore = set.tiebreakScore[player] ?? 0;
  const playerWon = gameScore > opponentScore;
  if (playerWon) {
    return String(gameScore);
  }
  return React.createElement(
    'span',
    null,
    gameScore,
    React.createElement('sup', { className: 'text-[9px] leading-none opacity-80' }, tbScore),
  );
}
