import type { TimelinePoint } from '@/core/scoring/types';
import { type StrokeSideStats } from './types';
import { getPointShotDetails } from './pressure-shot-details.logic';

export interface OutcomeStats {
  winners: number;
  winnersByStroke: Record<string, number>;
  forcedErrors: number;
  forcedErrorsByStroke: Record<string, number>;
  unforcedErrors: number;
  unforcedErrorsByStroke: Record<string, number>;
  backhandStats: StrokeSideStats;
  forehandStats: StrokeSideStats;
}

function updateSideStats(stats: StrokeSideStats, outcome: 'winner' | 'unforced_error' | 'forced_error'): void {
  stats.total++;
  if (outcome === 'winner') stats.winners++;
  else if (outcome === 'unforced_error') stats.unforcedErrors++;
  else if (outcome === 'forced_error') stats.forcedErrors++;
}

function applyLegacyFallback(
  points: TimelinePoint[],
  player: 'PLAYER_1' | 'PLAYER_2',
  current: OutcomeStats,
): OutcomeStats {
  const isExcluded = (p: TimelinePoint) =>
    p.type === 'ACE' ||
    p.type === 'SERVICE_ACE' ||
    p.type === 'DOUBLE_FAULT' ||
    p.rallyDetails?.tipo === 'dupla_falta';

  const legacyWinners = points.filter(p => !isExcluded(p) && p.winner === player && p.rallyDetails?.tipo === 'winner').length;
  const legacyForced = points.filter(p => !isExcluded(p) && p.winner !== player && p.rallyDetails?.tipo === 'erro_forcado').length;
  const legacyUnforced = points.filter(p => !isExcluded(p) && p.winner !== player && p.rallyDetails?.tipo === 'erro_nao_forcado').length;

  return {
    ...current,
    winners: Math.max(current.winners, legacyWinners),
    forcedErrors: Math.max(current.forcedErrors, legacyForced),
    unforcedErrors: Math.max(current.unforcedErrors, legacyUnforced),
  };
}

export function aggregatePlayerOutcomes(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2'): OutcomeStats {
  const result: OutcomeStats = {
    winners: 0,
    winnersByStroke: {},
    forcedErrors: 0,
    forcedErrorsByStroke: {},
    unforcedErrors: 0,
    unforcedErrorsByStroke: {},
    backhandStats: { winners: 0, unforcedErrors: 0, forcedErrors: 0, total: 0 },
    forehandStats: { winners: 0, unforcedErrors: 0, forcedErrors: 0, total: 0 },
  };

  for (const p of points) {
    const details = getPointShotDetails(p);
    if (!details || details.executor !== player) continue;

    if (details.outcome === 'winner') {
      result.winners++;
      if (details.stroke) {
        result.winnersByStroke[details.stroke] = (result.winnersByStroke[details.stroke] || 0) + 1;
      }
    } else if (details.outcome === 'unforced_error') {
      result.unforcedErrors++;
      if (details.stroke) {
        result.unforcedErrorsByStroke[details.stroke] = (result.unforcedErrorsByStroke[details.stroke] || 0) + 1;
      }
    } else if (details.outcome === 'forced_error') {
      result.forcedErrors++;
      if (details.stroke) {
        result.forcedErrorsByStroke[details.stroke] = (result.forcedErrorsByStroke[details.stroke] || 0) + 1;
      }
    }

    if (details.strokeSide === 'backhand') {
      updateSideStats(result.backhandStats, details.outcome);
    } else if (details.strokeSide === 'forehand') {
      updateSideStats(result.forehandStats, details.outcome);
    }
  }

  return applyLegacyFallback(points, player, result);
}
