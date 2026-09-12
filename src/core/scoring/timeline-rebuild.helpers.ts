import type { HistoryEntry, PointDetails } from '@/core/scoring/types';
import type { PointLogRow } from './timeline-rebuild';
import type { ScoringEngine } from '@/core/scoring/engine';
import { getLogPointDetails } from './timeline-rebuild.merge.helpers';

export function pointLogToFlow(log: PointLogRow): import('@/core/scoring/types').PointFlow {
  const ann = log.annotations;
  return {
    winnerId: log.winnerId,
    type: log.type,
    serverId: log.serverId,
    timestamp: log.timestamp.getTime(),
    isFirstServe: ann?.isFirstServe,
    isSecondServe: ann?.isSecondServe,
    firstFault: log.type === 'FAULT_FIRST',
    firstFaultDetail: ann?.firstFaultDetail ?? null,
    rallyDetails: ann?.rallyDetails ?? null,
    rallyLength: ann?.rallyLength,
  };
}

export function getLastPointDetails(engine: ScoringEngine): PointDetails | null {
  const history = engine.getPointHistory();
  return history.length > 0 ? history[history.length - 1].point : null;
}

export function addSuccessfulEntry(
  history: HistoryEntry[],
  stateBefore: ReturnType<ScoringEngine['getState']>,
  details: PointDetails | null,
  log: PointLogRow,
): void {
  history.push({ stateBefore, point: details ?? getLogPointDetails(log) });
}

export function addFailedEntry(
  history: HistoryEntry[],
  stateBefore: ReturnType<ScoringEngine['getState']>,
  log: PointLogRow,
): void {
  history.push({ stateBefore, point: getLogPointDetails(log) });
}
