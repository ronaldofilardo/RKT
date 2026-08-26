import type { ScoringEngine } from '@/core/scoring/engine';
import type { HistoryEntry, ScoringState } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';
import { persistStateWithRetry } from './useScoringHandlers.persistence';

type PersistenceDeps = {
  engineRef: { current: ScoringEngine | null };
  matchId: string;
  match: MatchData | null;
  tokenRef: { current: string | null };
  setError: (error: string | null) => void;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  setMatch: (update: (previous: MatchData | null) => MatchData | null) => void;
};

export function createStatePersistence(deps: PersistenceDeps) {
  return async (state: ScoringState, label: string, options?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean }) => {
    const engineWithHistory = deps.engineRef.current as (ScoringEngine & { getPointHistory?: () => HistoryEntry[] }) | null;
    const history = engineWithHistory?.getPointHistory?.();
    const result = await persistStateWithRetry(state, label, {
      matchId: deps.matchId,
      match: deps.match,
      tokenRef: deps.tokenRef,
      setError: deps.setError,
      fetchMatch: deps.fetchMatch,
      allowScoreEdit: options?.allowScoreEdit,
      isManualScoreEdit: options?.isManualScoreEdit,
      history,
    });
    if (result.success && result.version !== undefined) deps.setMatch((previous) => previous ? { ...previous, version: result.version } : previous);
    return result;
  };
}
