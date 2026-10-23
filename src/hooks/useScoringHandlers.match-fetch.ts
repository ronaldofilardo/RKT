import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import { buildEngineConfig } from '@/core/scoring/engine-config';
import type { HistoryEntry, ScoringState } from '@/core/scoring/types';
import type { MatchDataWithSequence, MatchFetchDeps, ScoreStateEnvelope } from './useScoringHandlers.match-fetch.types';
import { rehydrateEngineFromLogs } from './match-fetch-replay.logic';

export type { ScoreStateEnvelope, PointLogAnnotations, ActiveLogSummary, MatchDataWithSequence, MatchFetchDeps } from './useScoringHandlers.match-fetch.types';
export { rehydrateEngineFromLogs } from './match-fetch-replay.logic';

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
          let scoreStateToUse: ScoringState | ScoreStateEnvelope | string | null = data.scoreState;

          if (scoreStateToUse) {
            if (typeof scoreStateToUse === 'string') {
              try {
                scoreStateToUse = JSON.parse(scoreStateToUse) as ScoringState | ScoreStateEnvelope;
              } catch (error) {
                logger.warn('[MATCH FETCH] Falha ao parsear scoreState string; seguindo com o valor original:', error);
              }
            }
            const envelope: ScoreStateEnvelope | null =
              typeof scoreStateToUse === 'object' && scoreStateToUse !== null
                ? (scoreStateToUse as ScoreStateEnvelope)
                : null;
            const targetObj = (envelope?.state ? envelope.state : (scoreStateToUse as ScoringState))!;
            if (!targetObj.setsWon) {
              targetObj.setsWon = { player1: 0, player2: 0 };
            }

            const hasHistory = Array.isArray(envelope?.history) && envelope.history.length > 0;
            const hasPointsInGame = Boolean(
              targetObj?.currentGame && (targetObj.currentGame.player1 > 0 || targetObj.currentGame.player2 > 0)
            );
            const hasGamesInSets = (targetObj?.sets ?? []).some(
              (s) => (s.player1 || 0) > 0 || (s.player2 || 0) > 0
            );
            const hasStartedScoring = hasHistory || hasPointsInGame || hasGamesInSets;

            if (data.initialServerId || hasStartedScoring) {
              engineRef.current = ScoringEngine.fromSerialized(config, JSON.stringify(scoreStateToUse));
            } else {
              openRef.current('setup');
            }
          } else if (data.initialServerId) {
            engineRef.current = new ScoringEngine(config);
          } else {
            openRef.current('setup');
          }
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

        if (forceEngineReset && engineRef.current) {
          // Lê do engine com histórico restaurado ou do recente de PointLogs do servidor
          const engineHistory = engineRef.current.getPointHistory();
          const synced = engineHistory.slice(-20).map((entry) => entry.point.winnerId);
          const serverRecent = Array.isArray(data.recentWinnerIds) ? data.recentWinnerIds : [];
          const finalBadges = synced.length > 0 ? synced : serverRecent;
          setPointsHistory(finalBadges.length > 0 ? finalBadges : []);
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
