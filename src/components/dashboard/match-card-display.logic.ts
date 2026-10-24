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
 * Formata o placar de um set em notação compacta para exibição no card.
 *
 * - Set normal:          "6" / "3" (games)
 * - Tiebreak regular:    "7 [6]" / "6" (games com placar do TB)
 * - Match Tiebreak:      "10 [8]" / "8" (pontos do TB)
 *
 * A notação é compacta para caber nas colunas de 3.5rem do grid.
 */
export function formatCompactSetScore(
  set: SetCellScore,
  player: 'player1' | 'player2',
  isDecisiveMatchTiebreak = false,
): string {
  // Bug fix (2026-09-08): a checagem original só reconhecia um tiebreak comum de
  // set quando os games JÁ estavam resolvidos em 7-6/6-7. Enquanto o tiebreak
  // ainda está em andamento (games empatados, ex.: 6x6, tiebreak 1x1), a
  // condição era falsa e o código caía no ramo pensado para o Match Tiebreak
  // decisivo, mostrando só os pontos do tiebreak (ex.: "1") e perdendo
  // completamente o placar de games do set (6x6). Agora, sempre que NÃO for o
  // Match Tiebreak decisivo, um set com tiebreakScore (em andamento ou já
  // resolvido) mostra games + pontos diretos do tiebreak: "6[1]", "7[7]" etc.
  if (!isDecisiveMatchTiebreak && set.tiebreakScore) {
    const gameScore = set[player] ?? 0;
    const tbScore = set.tiebreakScore[player] ?? 0;
    return `${gameScore} [${tbScore}]`;
  }

  if (set.tiebreakScore) {
    const score = set.tiebreakScore[player] ?? 0;
    const opponent = player === 'player1' ? set.tiebreakScore.player2 : set.tiebreakScore.player1;
    if (score > opponent) {
      return `${score} [${opponent}]`;
    }
    return String(score);
  }

  return String(set[player] ?? 0);
}
