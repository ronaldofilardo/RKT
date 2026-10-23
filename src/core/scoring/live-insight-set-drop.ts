import type { TimelinePoint } from './types';
import { computeShotAnalysis } from '@/core/report/pressure-shot-stats';
import type { TacticalInsight } from './live-tactical-insights.types';

/**
 * Detecta queda significativa de rendimento do jogador entre o 1º set e o
 * set atual (aumento de erros não-forçados ≥ 1.8x com ≥ 5 erros no atual).
 */
export function detectSetPerformanceDrop(
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
