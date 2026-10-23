import type { TimelinePoint } from './types';
import { computeShotAnalysis } from '@/core/report/pressure-shot-stats';
import { detectWingWeakness, detectNetVulnerability, detectDoubleFaultAlert } from './live-insight-detectors';
import { detectSetPerformanceDrop } from './live-insight-set-drop';
import type { TacticalInsight } from './live-tactical-insights.types';

export type { LiveMatchCounters, TacticalInsight } from './live-tactical-insights.types';
export { computeLiveCounters } from './live-counters.logic';

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
