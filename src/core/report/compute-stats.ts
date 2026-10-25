import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import type { AdvancedMatchStats } from './types';
import { computeServeStats, computeReturnStats } from './serve-return-stats';
import { computePressureStats, computeShotAnalysis } from './pressure-shot-stats';
import { computeMomentum, computeSetBreakdown } from './momentum-set-stats';
import { computeBaselineStats } from './baseline-stats.logic';
import { computeNetPassStats } from './net-pass-stats.logic';
import { computePointDefinitionStats } from './point-definition-stats.logic';
import { computeStrokeMatrixStats } from './stroke-matrix-stats.logic';
import { computeMatchDurations } from './report-duration.logic';

export * from './types';
export { computeServeStats, computeReturnStats } from './serve-return-stats';
export { computePressureStats, computeShotAnalysis } from './pressure-shot-stats';
export { computeMomentum, computeSetBreakdown } from './momentum-set-stats';
export { computeBaselineStats } from './baseline-stats.logic';
export { computeNetPassStats } from './net-pass-stats.logic';
export { computePointDefinitionStats } from './point-definition-stats.logic';
export { computeStrokeMatrixStats } from './stroke-matrix-stats.logic';
export { computeMatchDurations } from './report-duration.logic';

export function computeAdvancedStats(points: TimelinePoint[], format?: TennisFormat): AdvancedMatchStats {
  return {
    serve: {
      player1: computeServeStats(points, 1, format),
      player2: computeServeStats(points, 2, format),
    },
    returnStats: {
      player1: computeReturnStats(points, 1, format),
      player2: computeReturnStats(points, 2, format),
    },
    pressure: {
      player1: computePressureStats(points, 1, format),
      player2: computePressureStats(points, 2, format),
    },
    shots: {
      player1: computeShotAnalysis(points, 1),
      player2: computeShotAnalysis(points, 2),
    },
    momentum: computeMomentum(points),
    setBreakdown: computeSetBreakdown(points),
    baseline: {
      player1: computeBaselineStats(points, 'PLAYER_1'),
      player2: computeBaselineStats(points, 'PLAYER_2'),
    },
    netPass: {
      player1: computeNetPassStats(points, 'PLAYER_1'),
      player2: computeNetPassStats(points, 'PLAYER_2'),
    },
    pointDefinition: {
      player1: computePointDefinitionStats(points, 'PLAYER_1'),
      player2: computePointDefinitionStats(points, 'PLAYER_2'),
    },
    strokeMatrix: {
      player1: computeStrokeMatrixStats(points, 'PLAYER_1'),
      player2: computeStrokeMatrixStats(points, 'PLAYER_2'),
    },
    durations: computeMatchDurations(points),
  };
}
