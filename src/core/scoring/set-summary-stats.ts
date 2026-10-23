import type { TimelinePoint } from './types';
import type { GameErrorEntry } from './game-errors';
import { classifyPointError, computeGameErrors } from './game-errors';
import { calculateServiceStats, calculateReturnBreakPoints } from './set-summary-service.logic';
import type { PlayerSetStats, SetSummaryReport } from './set-summary-stats.types';

// Fonte canônica dos erros por game movida para `game-errors.ts`.
// Re-exportados para manter a API pública existente.
export type { GameErrorEntry };
export { computeGameErrors };
export type { SetSummaryReport };

function calculatePlayerErrors(
  points: TimelinePoint[],
  targetServer: 'player1' | 'player2',
  targetWinner: 'PLAYER_1' | 'PLAYER_2',
) {
  let unforcedErrors = 0;
  let forcedErrors = 0;

  for (const p of points) {
    if (p.winner === targetWinner) continue;

    // target perdeu o ponto → target é o ofensor.
    const kind = classifyPointError(p, targetServer);
    if (kind === 'unforced') {
      unforcedErrors++;
    } else if (kind === 'forced') {
      forcedErrors++;
    }
  }

  return {
    unforcedErrors,
    forcedErrors,
    totalErrors: unforcedErrors + forcedErrors,
  };
}

function calculatePlayerStats(points: TimelinePoint[], player: 'player1' | 'player2'): PlayerSetStats {
  const isP1 = player === 'player1';
  const targetWinner = isP1 ? 'PLAYER_1' : 'PLAYER_2';
  const targetServer = isP1 ? 'player1' : 'player2';

  const totalPointsWon = points.filter(p => p.winner === targetWinner).length;
  const serviceStats = calculateServiceStats(points, targetServer, targetWinner);
  const returnStats = calculateReturnBreakPoints(points, targetServer, targetWinner);
  const errorStats = calculatePlayerErrors(points, targetServer, targetWinner);

  return {
    ...serviceStats,
    ...returnStats,
    ...errorStats,
    totalPointsWon,
  };
}

export function computeSetSummary(
  allPoints: TimelinePoint[],
  setNumber: number,
  fallbackScore?: { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } }
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

  const winner: 'player1' | 'player2' | null =
    p1Games > p2Games
      ? 'player1'
      : p2Games > p1Games
        ? 'player2'
        : tiebreakScore
          ? tiebreakScore.player1 > tiebreakScore.player2
            ? 'player1'
            : 'player2'
          : null;

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
    isCompleted: winner !== null,
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
