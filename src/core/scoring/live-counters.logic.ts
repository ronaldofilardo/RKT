import type { TimelinePoint } from './types';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import type { LiveMatchCounters } from './live-tactical-insights.types';

const EMPTY_COUNTERS: LiveMatchCounters = {
  aces: { p1: 0, p2: 0 },
  doubleFaults: { p1: 0, p2: 0 },
  breakPoints: {
    p1: { converted: 0, total: 0, pct: 0 },
    p2: { converted: 0, total: 0, pct: 0 },
  },
  breakPointsSaved: {
    p1: { saved: 0, total: 0, pct: 0 },
    p2: { saved: 0, total: 0, pct: 0 },
  },
  forcedErrors: { p1: 0, p2: 0 },
  unforcedErrors: { p1: 0, p2: 0 },
  totalPointsWon: { p1: 0, p2: 0 },
};

function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function computeLiveCounters(points: TimelinePoint[]): LiveMatchCounters {
  if (!points || points.length === 0) {
    return EMPTY_COUNTERS;
  }

  const stats = computeAdvancedStats(points);

  const bpConvP1 = stats.returnStats.player1.breakPointsConverted;
  const bpOppP1 = stats.returnStats.player1.breakPointOpportunities;
  const bpConvP2 = stats.returnStats.player2.breakPointsConverted;
  const bpOppP2 = stats.returnStats.player2.breakPointOpportunities;

  const bpSavedP1 = stats.serve.player1.breakPointsSaved;
  const bpFacedP1 = stats.serve.player1.breakPointsFaced;
  const bpSavedP2 = stats.serve.player2.breakPointsSaved;
  const bpFacedP2 = stats.serve.player2.breakPointsFaced;

  let p1Points = 0;
  let p2Points = 0;
  for (const pt of points) {
    if (pt.winner === 'PLAYER_1') p1Points++;
    else if (pt.winner === 'PLAYER_2') p2Points++;
  }

  return {
    aces: {
      p1: stats.serve.player1.aces,
      p2: stats.serve.player2.aces,
    },
    doubleFaults: {
      p1: stats.serve.player1.doubleFaults,
      p2: stats.serve.player2.doubleFaults,
    },
    breakPoints: {
      p1: { converted: bpConvP1, total: bpOppP1, pct: pctOf(bpConvP1, bpOppP1) },
      p2: { converted: bpConvP2, total: bpOppP2, pct: pctOf(bpConvP2, bpOppP2) },
    },
    breakPointsSaved: {
      p1: { saved: bpSavedP1, total: bpFacedP1, pct: pctOf(bpSavedP1, bpFacedP1) },
      p2: { saved: bpSavedP2, total: bpFacedP2, pct: pctOf(bpSavedP2, bpFacedP2) },
    },
    forcedErrors: {
      p1: stats.shots.player1.forcedErrors,
      p2: stats.shots.player2.forcedErrors,
    },
    unforcedErrors: {
      p1: stats.shots.player1.unforcedErrors,
      p2: stats.shots.player2.unforcedErrors,
    },
    totalPointsWon: {
      p1: p1Points,
      p2: p2Points,
    },
  };
}
