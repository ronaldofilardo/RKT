import type { TimelinePoint } from './types';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { computeShotAnalysis } from '@/core/report/pressure-shot-stats';
import type { LiveMatchCounters, TacticalInsight } from './live-tactical-insights.types';
import { detectWingWeakness, detectNetVulnerability, detectDoubleFaultAlert } from './live-insight-detectors';

export type { LiveMatchCounters, TacticalInsight } from './live-tactical-insights.types';

export function computeLiveCounters(points: TimelinePoint[]): LiveMatchCounters {
  if (!points || points.length === 0) {
    return {
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
      p1: {
        converted: bpConvP1,
        total: bpOppP1,
        pct: bpOppP1 > 0 ? Math.round((bpConvP1 / bpOppP1) * 100) : 0,
      },
      p2: {
        converted: bpConvP2,
        total: bpOppP2,
        pct: bpOppP2 > 0 ? Math.round((bpConvP2 / bpOppP2) * 100) : 0,
      },
    },
    breakPointsSaved: {
      p1: {
        saved: bpSavedP1,
        total: bpFacedP1,
        pct: bpFacedP1 > 0 ? Math.round((bpSavedP1 / bpFacedP1) * 100) : 0,
      },
      p2: {
        saved: bpSavedP2,
        total: bpFacedP2,
        pct: bpFacedP2 > 0 ? Math.round((bpSavedP2 / bpFacedP2) * 100) : 0,
      },
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

function detectSetPerformanceDrop(
  points: TimelinePoint[],
  playerIndex: 1 | 2,
  side: 'player1' | 'player2',
  name: string,
  currentSet: number,
): TacticalInsight | null {
  if (currentSet < 2) return null;

  const set1Points = points.filter((p) => (p.setNumber || 1) === 1);
  const set2Points = points.filter((p) => (p.setNumber || 1) === currentSet);

  if (set1Points.length < 10 || set2Points.length < 8) return null;

  const shotSet1 = computeShotAnalysis(set1Points, playerIndex);
  const shotSet2 = computeShotAnalysis(set2Points, playerIndex);

  const isSignificantDrop =
    shotSet2.unforcedErrors >= 5 &&
    shotSet2.unforcedErrors >= shotSet1.unforcedErrors * 1.8;

  if (!isSignificantDrop) return null;

  return {
    id: `set-drop-${side}-set${currentSet}`,
    type: 'trend',
    title: 'Queda de Rendimento',
    message: `${name} aumentou significativamente os erros não-forçados (${shotSet1.unforcedErrors} no 1º set vs ${shotSet2.unforcedErrors} no ${currentSet}º).`,
    playerSide: side,
    icon: '📉',
  };
}

export function detectTacticalTrends(
  points: TimelinePoint[],
  player1Name: string,
  player2Name: string,
  targetSetNumber?: number,
): TacticalInsight[] {
  if (!points || points.length < 4) return [];

  const maxSetInPoints = points.reduce((max, p) => Math.max(max, p.setNumber || 1), 1);
  const currentSet = targetSetNumber || maxSetInPoints;
  const currentSetPoints = points.filter((p) => (p.setNumber || 1) === currentSet);

  const insights: TacticalInsight[] = [];

  const players: Array<{ side: 'player1' | 'player2'; playerIndex: 1 | 2; name: string }> = [
    { side: 'player1', playerIndex: 1, name: player1Name },
    { side: 'player2', playerIndex: 2, name: player2Name },
  ];

  for (const { side, playerIndex, name } of players) {
    if (currentSetPoints.length >= 6) {
      const shotStats = computeShotAnalysis(currentSetPoints, playerIndex);

      const wingWeakness = detectWingWeakness(shotStats, side, name, currentSet);
      if (wingWeakness) insights.push(wingWeakness);

      const netVuln = detectNetVulnerability(shotStats, side, name, currentSet);
      if (netVuln) insights.push(netVuln);

      const dfAlert = detectDoubleFaultAlert(currentSetPoints, side, name, currentSet);
      if (dfAlert) insights.push(dfAlert);
    }

    const setDrop = detectSetPerformanceDrop(points, playerIndex, side, name, currentSet);
    if (setDrop) insights.push(setDrop);
  }

  return insights;
}
