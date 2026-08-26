import { logger } from '@/lib/logger';
import type { ScoringEngine } from '@/core/scoring/engine';
import type { PointFlow, ScoringState } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';
import type { QueuedAction } from '@/schemas/contracts';
import { applyLocalPoint, canProcessPoint, reconcileServerState } from './useScoringHandlers.process-point.helpers';

type PointSync = {
  syncPointToServer: (flow: PointFlow, sequence: number) => Promise<{ success: boolean; needsResync?: boolean; serverResponse?: { scoreState?: ScoringState } }>;
  queuePointForOffline: (enqueue: (action: Omit<QueuedAction, 'id' | 'status' | 'retries'>) => Promise<QueuedAction>, flow: PointFlow) => Promise<QueuedAction>;
};
type ProcessorDeps = {
  engineRef: { current: ScoringEngine | null };
  match: MatchData | null;
  isProcessingRef: { current: boolean };
  isOnline: boolean;
  enqueue: (action: Omit<QueuedAction, 'id' | 'status' | 'retries'>) => Promise<QueuedAction>;
  pointSync: PointSync;
  pointSequenceRef: { current: number };
  setScoreState: (state: ScoringState | null) => void;
  setPointsHistory: (update: (previous: string[]) => string[]) => void;
  setShowFinishedBanner: (visible: boolean) => void;
  setError: (error: string | null) => void;
  setMatch: (update: (previous: MatchData | null) => MatchData | null) => void;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
};

export function createPointProcessor(deps: ProcessorDeps) {
  return async (flow: PointFlow): Promise<string | undefined> => {
    if (!canProcessPoint(deps.engineRef, deps.match, deps.isProcessingRef)) return undefined;
    deps.isProcessingRef.current = true;
    try {
      const newState = applyLocalPoint(deps.engineRef, flow, deps.setScoreState, deps.setPointsHistory, deps.pointSequenceRef);
      if (!newState) return undefined;
      const sequence = deps.pointSequenceRef.current;
      if (deps.isOnline) {
        const result = await deps.pointSync.syncPointToServer(flow, sequence);
        if (result.success && result.serverResponse?.scoreState && deps.match) return reconcileServerState(result, deps.match, deps.engineRef, deps.setScoreState, deps.setMatch);
        if (result.needsResync) await deps.fetchMatch(true);
      } else {
        await deps.pointSync.queuePointForOffline(deps.enqueue, flow);
      }
      if (newState.isFinished) deps.setShowFinishedBanner(true);
      return undefined;
    } catch (error: unknown) {
      logger.error('[processPoint]', error);
      deps.setError('Erro ao registrar ponto');
      return undefined;
    } finally {
      deps.isProcessingRef.current = false;
    }
  };
}
