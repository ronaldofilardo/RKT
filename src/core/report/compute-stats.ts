import type { TimelinePoint } from '@/core/scoring/types';
import type { AdvancedMatchStats } from './types';
import { computeServeStats, computeReturnStats } from './serve-return-stats';
import { computePressureStats, computeShotAnalysis } from './pressure-shot-stats';
import { computeMomentum, computeSetBreakdown } from './momentum-set-stats';

export * from './types';
export { computeServeStats, computeReturnStats } from './serve-return-stats';
export { computePressureStats, computeShotAnalysis } from './pressure-shot-stats';
export { computeMomentum, computeSetBreakdown } from './momentum-set-stats';

export function computeAdvancedStats(points: TimelinePoint[]): AdvancedMatchStats {
  return {
    serve: {
      player1: computeServeStats(points, 1),
      player2: computeServeStats(points, 2),
    },
    returnStats: {
      player1: computeReturnStats(points, 1),
      player2: computeReturnStats(points, 2),
    },
    pressure: {
      player1: computePressureStats(points, 1),
      player2: computePressureStats(points, 2),
    },
    shots: {
      player1: computeShotAnalysis(points, 1),
      player2: computeShotAnalysis(points, 2),
    },
    momentum: computeMomentum(points),
    setBreakdown: computeSetBreakdown(points),
  };
}
