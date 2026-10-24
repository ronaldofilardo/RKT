import type { TimelinePoint } from './types';
import type { GameErrorEntry } from './game-errors';
import { computeGameErrors } from './game-errors';
import { calculatePlayerStats } from './set-summary-errors.logic';
import type { SetSummaryReport } from './set-summary-stats.types';

// Fonte canônica dos erros por game movida para `game-errors.ts`.
// Re-exportados para manter a API pública existente.
export type { GameErrorEntry };
export { computeGameErrors };
export type { SetSummaryReport };

/**
 * ATENÇÃO: `TimelinePoint.gamesScore` é o placar ANTES do ponto (stateBefore).
 * O último ponto de um set fechado, portanto, NÃO traz o placar final do set.
 * Por isso `fallbackScore` (vindo de `scoreState.sets[i]`) deve ser sempre
 * informado pelos chamadores; sem ele o placar é apenas uma aproximação.
 * `fallbackScore.isCompleted` (quando informado) define se o set está
 * concluído; sem ele vale "há vencedor pelo placar".
 */
export function computeSetSummary(
  allPoints: TimelinePoint[],
  setNumber: number,
  fallbackScore?: { player1: number; player2: number; isTiebreak?: boolean; isCompleted?: boolean; tiebreakScore?: { player1: number; player2: number } }
): SetSummaryReport {
  const setPoints = allPoints.filter(p => p.setNumber === setNumber);

  let p1Games = 0;
  let p2Games = 0;
  let tiebreakScore: { player1: number; player2: number } | undefined;

  if (fallbackScore) {
    p1Games = fallbackScore.player1;
    p2Games = fallbackScore.player2;
    tiebreakScore = fallbackScore.tiebreakScore;
  } else if (setPoints.length > 0) {
    const lastPoint = setPoints[setPoints.length - 1];
    p1Games = lastPoint.gamesScore.player1;
    p2Games = lastPoint.gamesScore.player2;
    if (lastPoint.isTiebreak && lastPoint.gameScore) {
      tiebreakScore = {
        player1: lastPoint.gameScore.player1,
        player2: lastPoint.gameScore.player2,
      };
    }
  }

  const winnerByScore: 'player1' | 'player2' | null =
    p1Games > p2Games
      ? 'player1'
      : p2Games > p1Games
        ? 'player2'
        : tiebreakScore
          ? tiebreakScore.player1 > tiebreakScore.player2
            ? 'player1'
            : 'player2'
          : null;

  const isCompleted = fallbackScore?.isCompleted ?? winnerByScore !== null;
  const winner = isCompleted ? winnerByScore : null;

  let durationMinutes: number | undefined;
  if (setPoints.length >= 2) {
    const firstTs = setPoints[0].recordedAt;
    const lastTs = setPoints[setPoints.length - 1].recordedAt;
    if (firstTs && lastTs) {
      const diff = new Date(lastTs).getTime() - new Date(firstTs).getTime();
      if (!isNaN(diff) && diff > 0) {
        durationMinutes = Math.max(1, Math.round(diff / 60000));
      }
    }
  }

  return {
    setNumber,
    isCompleted,
    score: {
      player1: p1Games,
      player2: p2Games,
      tiebreakScore,
    },
    winner,
    totalPoints: setPoints.length,
    durationMinutes,
    player1: calculatePlayerStats(setPoints, 'player1'),
    player2: calculatePlayerStats(setPoints, 'player2'),
    gameErrors: computeGameErrors(setPoints),
  };
}
