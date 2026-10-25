import type { TimelinePoint } from '@/core/scoring/types';
import type { PointDefinitionStats } from './report-analysis-matrix.types';

export function computePointDefinitionStats(
  points: TimelinePoint[],
  player: 'PLAYER_1' | 'PLAYER_2',
): PointDefinitionStats {
  let cleanWinners = 0;
  let unforcedErrors = 0;
  let forcedErrors = 0;

  for (const p of points) {
    if (p.type === 'ACE' || p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_FIRST') continue;

    if (p.winner === player) {
      if (p.type === 'WINNER' || p.rallyDetails?.tipo === 'winner') {
        cleanWinners++;
      }
    } else {
      if (p.type === 'UNFORCED_ERROR' || p.rallyDetails?.tipo === 'erro_nao_forcado') {
        unforcedErrors++;
      } else if (p.type === 'FORCED_ERROR' || p.rallyDetails?.tipo === 'erro_forcado') {
        forcedErrors++;
      }
    }
  }

  return {
    cleanWinners,
    forcedErrors,
    unforcedErrors,
    total: cleanWinners + forcedErrors + unforcedErrors,
  };
}
