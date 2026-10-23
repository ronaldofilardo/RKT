import type { TimelinePoint } from '@/core/scoring/types';
import { extractSetsFromScoreState } from './timeline-set-results-state.logic';
import { computeSetResultsFromPoints } from './timeline-set-results-points.logic';
import type { SetResult } from './timeline-set-results-state.logic';

export { extractSetsFromScoreState } from './timeline-set-results-state.logic';
export type { SetResult } from './timeline-set-results-state.logic';
export { computeSetResultsFromPoints } from './timeline-set-results-points.logic';

export function getSetResults(points: TimelinePoint[], scoreState?: unknown): SetResult[] {
  const fromState = extractSetsFromScoreState(scoreState);
  if (fromState && fromState.length > 0) {
    return fromState;
  }
  return computeSetResultsFromPoints(points);
}
