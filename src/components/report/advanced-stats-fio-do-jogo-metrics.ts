import type { AdvancedMatchStats } from '@/core/report/compute-stats';
import type { ChronoRun } from './advanced-stats-fio-do-jogo-runs';

// Fallback: runs sintéticos a partir de stats.momentum.scoringRuns (sem timeline)
export function buildFallbackRuns(stats: Pick<AdvancedMatchStats, 'momentum'>): ChronoRun[] {
  if (!stats.momentum?.scoringRuns || stats.momentum.scoringRuns.length === 0) return [];
  return stats.momentum.scoringRuns
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((sr, idx) => ({
      id: `run-fallback-${idx}`,
      player: sr.player,
      length: sr.length,
      startIndex: sr.start,
      endIndex: sr.end,
      startPointNumber: sr.start + 1,
      endPointNumber: sr.end + 1,
      setNumber: 1,
      aces: 0,
      winners: 0,
      breakPoints: 0,
      points: [],
    }));
}

// Métricas de dominância geral (runs + streaks do momentum)
export function computeDominanceMetrics(
  allChronologicalRuns: ChronoRun[],
  stats: Pick<AdvancedMatchStats, 'momentum'>,
) {
  let p1RunPoints = 0;
  let p2RunPoints = 0;
  let p1SuperRuns = 0;
  let p2SuperRuns = 0;

  allChronologicalRuns.forEach((r) => {
    if (r.player === 'PLAYER_1') {
      p1RunPoints += r.length;
      if (r.length >= 4) p1SuperRuns++;
    } else {
      p2RunPoints += r.length;
      if (r.length >= 4) p2SuperRuns++;
    }
  });

  const totalRunPts = p1RunPoints + p2RunPoints || 1;
  const p1Pct = Math.round((p1RunPoints / totalRunPts) * 100);
  const p2Pct = 100 - p1Pct;

  const maxStreakP1 = stats.momentum?.longestStreakP1 ?? stats.momentum?.longestWinningStreak ?? 0;
  const maxStreakP2 = stats.momentum?.longestStreakP2 ?? stats.momentum?.longestLosingStreak ?? 0;

  return {
    p1RunPoints,
    p2RunPoints,
    p1Pct,
    p2Pct,
    p1SuperRuns,
    p2SuperRuns,
    maxStreakP1,
    maxStreakP2,
    totalRuns: allChronologicalRuns.length,
  };
}
