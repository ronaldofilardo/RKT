import type { TimelinePoint } from '@/core/scoring/types';
import { type ShotAnalysis } from './types';
import { calcPercentage } from './pressure-break-stats.logic';
import { aggregatePlayerOutcomes } from './pressure-outcome-aggregate.logic';

export { computePressureStats } from './pressure-break-stats.logic';
export { getPointShotDetails } from './pressure-shot-details.logic';
export type { PointShotDetails } from './pressure-shot-details.logic';

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

