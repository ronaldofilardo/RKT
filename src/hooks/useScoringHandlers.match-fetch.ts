import { logger } from '@/lib/logger';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import type { HistoryEntry, ScoringState } from '@/core/scoring/types';
import type { MatchDataWithSequence, MatchFetchDeps, ScoreStateEnvelope } from './useScoringHandlers.match-fetch.types';
import { rehydrateEngineFromLogs } from './match-fetch-replay.logic';
import { restoreEngineFromScoreState } from './match-fetch-restore.logic';
import { syncRecentBadges } from './match-fetch-badges.logic';

export type { ScoreStateEnvelope, PointLogAnnotations, ActiveLogSummary, MatchDataWithSequence, MatchFetchDeps } from './useScoringHandlers.match-fetch.types';
export { rehydrateEngineFromLogs } from './match-fetch-replay.logic';
export { restoreEngineFromScoreState } from './match-fetch-restore.logic';
export { syncRecentBadges } from './match-fetch-badges.logic';

export function createMatchFetchService(deps: MatchFetchDeps) {
  const {
    matchId,
    tokenRef,
    matchVersionRef,
    pointSequenceRef,
    engineRef,
    openRef,
    setMatch,
    setScoreState,
    setPointsHistory,
    setIsLoading,
    setError,
  } = deps;

  const fetchMatch = async (forceEngineReset = false) => {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        headers: { authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao buscar partida: ${res.status}`);
      }
      const data = (await res.json()) as MatchDataWithSequence;
      setMatch(data);

      if (typeof data.version === 'number') {
        if (matchVersionRef.current !== null && data.version < matchVersionRef.current) {
          logger.warn(`[fetchMatch] Ignoring old data (v${data.version} < v${matchVersionRef.current})`);
          setIsLoading(false);
          return;
        }
        matchVersionRef.current = data.version;
      }

      if (data.lastPointSequence !== undefined) {
        pointSequenceRef.current = data.lastPointSequence;
      } else if (typeof data.version === 'number') {
        pointSequenceRef.current = data.version;
      }

      if (forceEngineReset || !engineRef.current) {
        const config = buildEngineConfig(data);

        const previousHistory = engineRef.current?.getPointHistory?.() ?? [];
        let rehydratedViaLogs = false;

        const hasActiveLogs = Array.isArray(data.activeLogsSinceEdit) && data.activeLogsSinceEdit.length > 0;
        if (hasActiveLogs) {
          const replayedEngine = rehydrateEngineFromLogs(config, data);
          if (replayedEngine) {
            engineRef.current = replayedEngine;
            rehydratedViaLogs = true;
          }
        }
        if (!rehydratedViaLogs) {
          restoreEngineFromScoreState(config, data, openRef, engineRef);
        }

        const serverHistoryLength = Array.isArray((data.scoreState as ScoreStateEnvelope | null)?.history)
          ? ((data.scoreState as ScoreStateEnvelope).history as HistoryEntry[]).length
          : 0;
        if (!rehydratedViaLogs && engineRef.current && previousHistory.length > serverHistoryLength) {
          engineRef.current.restorePointHistory(previousHistory);
        }

        setScoreState({
          type: 'RESYNCED_FROM_SERVER',
          payload: (engineRef.current?.getState() as ScoringState) ?? null,
        });

        if (forceEngineReset) {
          syncRecentBadges(engineRef, data, setPointsHistory);
        }
      }

      setIsLoading(false);
    } catch (err) {
      logger.error('[fetchMatch]', err);
      setError('Erro ao carregar partida');
      setIsLoading(false);
    }
  };

  return { fetchMatch };
}
