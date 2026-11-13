import type { TimelinePoint } from '@/core/scoring/types';
import { isSetDecidingPoint } from './timeline.logic';
import { computeTiebreakSetResult } from './timeline-set-tiebreak-result.logic';
import type { SetResult } from './timeline-set-results-state.logic';

function groupPointsBySet(points: TimelinePoint[]): {
  setOrder: number[];
  bySet: Map<number, TimelinePoint[]>;
} {
  const setOrder: number[] = [];
  const bySet = new Map<number, TimelinePoint[]>();
  for (const p of points) {
    if (!bySet.has(p.setNumber)) {
      setOrder.push(p.setNumber);
      bySet.set(p.setNumber, []);
    }
    bySet.get(p.setNumber)!.push(p);
  }
  return { setOrder, bySet };
}

function computeRegularSetResult(
  setNum: number,
  lastPoint: TimelinePoint,
  isGameFinished: boolean,
): SetResult {
  const winner = lastPoint.winner;
  return {
    setNumber: setNum,
    p1: lastPoint.gamesScore.player1 + (isGameFinished && winner === 'PLAYER_1' ? 1 : 0),
    p2: lastPoint.gamesScore.player2 + (isGameFinished && winner === 'PLAYER_2' ? 1 : 0),
  };
}

function computeSetResultFromPoints(
  setNum: number,
  setPoints: TimelinePoint[],
  isLastSet: boolean,
): SetResult | null {
  if (setPoints.length === 0) return null;
  const lastPoint = setPoints[setPoints.length - 1];
  // Se há um set posterior na lista de pontos, o set anterior com certeza encerrou no último ponto.
  // Se é o último set, verifica se o ponto foi definidor de game/set.
  const isGameFinished = !isLastSet || isSetDecidingPoint(lastPoint);
  if (lastPoint.isTiebreak) {
    return computeTiebreakSetResult(setNum, setPoints, lastPoint);
  }
  return computeRegularSetResult(setNum, lastPoint, isGameFinished);
}

export function computeSetResultsFromPoints(points: TimelinePoint[]): SetResult[] {
  if (!points || points.length === 0) return [];
  const { setOrder, bySet } = groupPointsBySet(points);
  const results: SetResult[] = []
  for (let sIdx = 0; sIdx < setOrder.length; sIdx++) {
    const setNum = setOrder[sIdx];
    const result = computeSetResultFromPoints(
      setNum,
      bySet.get(setNum)!,
      sIdx === setOrder.length - 1,
    );
    if (result) results.push(result);
  }
  return results;
}
