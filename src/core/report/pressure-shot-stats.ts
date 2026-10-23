import type { TimelinePoint } from '@/core/scoring/types';
import { type ShotAnalysis, type StrokeSideStats } from './types';
import { calcPercentage } from './pressure-break-stats.logic';
import { getPointShotDetails } from './pressure-shot-details.logic';

export { computePressureStats } from './pressure-break-stats.logic';
export { getPointShotDetails } from './pressure-shot-details.logic';
export type { PointShotDetails } from './pressure-shot-details.logic';


interface OutcomeStats {
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
  const legacyWinners = points.filter(p => p.winner === player && p.rallyDetails?.tipo === 'winner').length;
  const legacyForced = points.filter(p => p.winner !== player && p.rallyDetails?.tipo === 'erro_forcado').length;
  const legacyUnforced = points.filter(p => p.winner !== player && p.rallyDetails?.tipo === 'erro_nao_forcado').length;

  return {
    ...current,
    winners: Math.max(current.winners, legacyWinners),
    forcedErrors: Math.max(current.forcedErrors, legacyForced),
    unforcedErrors: Math.max(current.unforcedErrors, legacyUnforced),
  };
}

function aggregatePlayerOutcomes(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2'): OutcomeStats {
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

function computeNetApproaches(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2') {
  const netApproaches = points.filter(p => p.rallyDetails?.situacao === 'rede').length;
  const netApproachesWon = points.filter(p => p.rallyDetails?.situacao === 'rede' && p.winner === player).length;
  const netApproachPct = calcPercentage(netApproachesWon, netApproaches);

  return { netApproaches, netApproachesWon, netApproachPct };
}

function computeRallyMetrics(points: TimelinePoint[]) {
  const rallyLengths = points.map(p => p.rallyLength).filter(l => l > 0);
  const rallyAvgLength = rallyLengths.length > 0
    ? rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length
    : 0;

  const short = rallyLengths.filter(l => l <= 4).length;
  const medium = rallyLengths.filter(l => l >= 5 && l <= 8).length;
  const longRallies = rallyLengths.filter(l => l >= 9).length;

  return {
    rallyLengthDistribution: { short, medium, long: longRallies },
    rallyAvgLength,
  };
}

function countSpecialShots(points: TimelinePoint[]) {
  return {
    lobCount: points.filter(p => p.rallyDetails?.golpe_esp === 'lob').length,
    dropShotCount: points.filter(p => p.rallyDetails?.golpe_esp === 'drop_shot').length,
    smashCount: points.filter(p => p.rallyDetails?.golpe === 'smash').length,
  };
}

export function computeShotAnalysis(points: TimelinePoint[], playerIndex: 1 | 2): ShotAnalysis {
  const player = `PLAYER_${playerIndex}` as const;

  return {
    ...aggregatePlayerOutcomes(points, player),
    ...computeNetApproaches(points, player),
    ...computeRallyMetrics(points),
    ...countSpecialShots(points),
  };
}

