import type { ServeStats, ReturnStats, PressureStats } from './report-stats.types';

export interface StrokeSideStats {
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  total: number;
}

export interface ShotAnalysis {
  winners: number;
  winnersByStroke: Record<string, number>;
  forcedErrors: number;
  forcedErrorsByStroke: Record<string, number>;
  unforcedErrors: number;
  unforcedErrorsByStroke: Record<string, number>;
  backhandStats: StrokeSideStats;
  forehandStats: StrokeSideStats;
  netApproaches: number;
  netApproachesWon: number;
  netApproachPct: number;
  rallyLengthDistribution: { short: number; medium: number; long: number };
  rallyAvgLength: number;
  lobCount: number;
  dropShotCount: number;
  smashCount: number;
}

export interface MomentumStats {
  longestWinningStreak: number;
  longestLosingStreak: number;
  longestStreakP1?: number;
  longestStreakP2?: number;
  currentStreak: number;
  scoringRuns: Array<{ player: 'PLAYER_1' | 'PLAYER_2'; length: number; start: number; end: number }>;
  streakCountP1: { len2: number; len3: number; len4Plus: number };
  streakCountP2: { len2: number; len3: number; len4Plus: number };
}

export interface SetBreakdown {
  setNumber: number;
  totalPoints: number;
  p1Points: number;
  p2Points: number;
  p1Games: number;
  p2Games: number;
  isTiebreak: boolean;
  tiebreakP1?: number;
  tiebreakP2?: number;
  duration?: number;
  effectiveDuration?: number;
  p1Aces: number;
  p2Aces: number;
  p1Winners: number;
  p2Winners: number;
  p1Errors: number;
  p2Errors: number;
}

import type {
  BaselineStats,
  NetPassStats,
  PointDefinitionStats,
  StrokeMatrixRow,
} from './report-analysis-matrix.types';
import type { MatchDurationStats } from './report-duration.logic';

export type {
  BaselineStats,
  NetPassStats,
  PointDefinitionStats,
  StrokeMatrixRow,
  MatchDurationStats,
};

export interface AdvancedMatchStats {
  serve: { player1: ServeStats; player2: ServeStats };
  returnStats: { player1: ReturnStats; player2: ReturnStats };
  pressure: { player1: PressureStats; player2: PressureStats };
  shots: { player1: ShotAnalysis; player2: ShotAnalysis };
  momentum: MomentumStats;
  setBreakdown: SetBreakdown[];
  baseline?: { player1: BaselineStats; player2: BaselineStats };
  netPass?: { player1: NetPassStats; player2: NetPassStats };
  pointDefinition?: { player1: PointDefinitionStats; player2: PointDefinitionStats };
  strokeMatrix?: { player1: StrokeMatrixRow[]; player2: StrokeMatrixRow[] };
  durations?: MatchDurationStats;
}
