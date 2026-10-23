import type { TimelinePoint } from './types';
import { classifyPointError } from './game-errors';
import { calculateServiceStats, calculateReturnBreakPoints } from './set-summary-service.logic';
import type { PlayerSetStats } from './set-summary-stats.types';

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

export function calculatePlayerStats(points: TimelinePoint[], player: 'player1' | 'player2'): PlayerSetStats {
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
