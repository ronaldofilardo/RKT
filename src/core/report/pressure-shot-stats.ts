import type { TimelinePoint } from '@/core/scoring/types';
import { type ShotAnalysis } from './types';
import { calcPercentage } from './pressure-break-stats.logic';
import { aggregatePlayerOutcomes } from './pressure-outcome-aggregate.logic';

export { computePressureStats } from './pressure-break-stats.logic';
export { getPointShotDetails } from './pressure-shot-details.logic';
export type { PointShotDetails } from './pressure-shot-details.logic';

function computeNetApproaches(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2') {
  // Item 1.5: Subidas = Rede ganhas + Passada perdidas pelo jogador
  const netApproachesWon = points.filter(p => p.rallyDetails?.situacao === 'rede' && p.winner === player).length;
  const netApproachesLost = points.filter(p => p.rallyDetails?.situacao === 'passada' && p.winner !== player).length;
  const netApproaches = netApproachesWon + netApproachesLost;
  const netApproachPct = calcPercentage(netApproachesWon, netApproaches);

  return { netApproaches, netApproachesWon, netApproachPct };
}

export function resolvePointRallyCategory(p: TimelinePoint): 'short' | 'medium' | 'long' | null {
  // Item 1.1: Converter duracao em faixa ao ler
  const duracao = p.rallyDetails?.duracao;
  if (duracao === 'opcao_1') return 'short';
  if (duracao === 'opcao_2') return 'medium';
  if (duracao === 'opcao_3') return 'long';

  const len = p.rallyLength;
  if (len > 0) {
    if (len <= 4) return 'short';
    if (len <= 8) return 'medium';
    return 'long';
  }
  return null;
}

export function resolvePointEffectiveRallyLength(p: TimelinePoint): number | null {
  const duracao = p.rallyDetails?.duracao;
  if (duracao === 'opcao_1' && p.rallyLength <= 2) return 3;
  if (duracao === 'opcao_2' && p.rallyLength <= 2) return 6;
  if (duracao === 'opcao_3' && p.rallyLength <= 2) return 10;
  return p.rallyLength > 0 ? p.rallyLength : null;
}

export function computeRallyMetrics(points: TimelinePoint[]) {
  let short = 0;
  let medium = 0;
  let longRallies = 0;
  let totalBalls = 0;
  let pointsCount = 0;

  for (const p of points) {
    const cat = resolvePointRallyCategory(p);
    if (cat === 'short') short++;
    else if (cat === 'medium') medium++;
    else if (cat === 'long') longRallies++;

    const len = resolvePointEffectiveRallyLength(p);
    if (len !== null) {
      totalBalls += len;
      pointsCount++;
    }
  }

  const rallyAvgLength = pointsCount > 0 ? totalBalls / pointsCount : 0;

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

