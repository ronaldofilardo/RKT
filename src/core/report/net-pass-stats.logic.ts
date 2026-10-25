import type { TimelinePoint } from '@/core/scoring/types';
import type { NetPassStats } from './report-analysis-matrix.types';

function calcPct(n: number, d: number): number {
  return d > 0 ? (n / d) * 100 : 0;
}

export function computeNetPassStats(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2'): NetPassStats {
  const netApproachesWon = points.filter(
    p => p.rallyDetails?.situacao === 'rede' && p.winner === player,
  ).length;

  const netApproachesLost = points.filter(
    p => p.rallyDetails?.situacao === 'passada' && p.winner !== player,
  ).length;

  const netApproaches = netApproachesWon + netApproachesLost;
  const netApproachPct = calcPct(netApproachesWon, netApproaches);

  const passingShotsWon = points.filter(
    p => p.rallyDetails?.situacao === 'passada' && p.winner === player,
  ).length;

  const passingShotsLost = points.filter(
    p => p.rallyDetails?.situacao === 'rede' && p.winner !== player,
  ).length;

  const passingShotsAttempted = passingShotsWon + passingShotsLost;
  const passingShotPct = calcPct(passingShotsWon, passingShotsAttempted);

  return {
    netApproaches,
    netApproachesWon,
    netApproachPct,
    passingShotsAttempted,
    passingShotsWon,
    passingShotPct,
  };
}
