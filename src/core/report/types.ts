export type {
  ServeStats,
  ReturnStats,
  PressureStats,
} from './report-stats.types';

export type {
  StrokeSideStats,
  ShotAnalysis,
  MomentumStats,
  SetBreakdown,
  AdvancedMatchStats,
  BaselineStats,
  NetPassStats,
  PointDefinitionStats,
  StrokeMatrixRow,
} from './report-analysis.types';

export function isServer(p: import('@/core/scoring/types').TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.server === `player${playerIndex}`;
}

export function isWinner(p: import('@/core/scoring/types').TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.winner === `PLAYER_${playerIndex}`;
}
