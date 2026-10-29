import type { TimelinePoint } from '@/core/scoring/types';
import type { MomentumStats } from './types';
import { extractScoringRuns } from './momentum-scoring-runs';
import { calculateStreaks } from './momentum-streaks';

export function computeMomentum(points: TimelinePoint[]): MomentumStats {
  if (points.length === 0) {
    return {
      longestWinningStreak: 0,
      longestLosingStreak: 0,
      currentStreak: 0,
      scoringRuns: [],
      streakCountP1: { len2: 0, len3: 0, len4Plus: 0 },
      streakCountP2: { len2: 0, len3: 0, len4Plus: 0 },
    };
  }

  const scoringRuns = extractScoringRuns(points);
  const { longestWinning, longestLosing, current } = calculateStreaks(points);

  const streakCountP1 = { len2: 0, len3: 0, len4Plus: 0 };
  const streakCountP2 = { len2: 0, len3: 0, len4Plus: 0 };

  for (const run of scoringRuns) {
    const target = run.player === 'PLAYER_1' ? streakCountP1 : streakCountP2;
    if (run.length === 2) target.len2++;
    else if (run.length === 3) target.len3++;
    else target.len4Plus++;
  }

  return {
    longestWinningStreak: longestWinning,
    longestLosingStreak: longestLosing,
    longestStreakP1: longestWinning,
    longestStreakP2: longestLosing,
    currentStreak: current,
    scoringRuns,
    streakCountP1,
    streakCountP2,
  };
}
