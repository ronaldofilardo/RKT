import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { HistoryEntry, ScoringState, TennisFormat } from '@/core/scoring/types';
import type { ScoreAction } from '@/hooks/useScoreReducer';
import type { MatchData } from './useScoringHandlers.types';

/** Envelope que o servidor pode devolver no `scoreState` (ver persistStateWithRetry). */
type ScoreStateEnvelope = { state?: ScoringState; history?: HistoryEntry[] };

export interface ActiveLogSummary {
  id: string;
  winnerId: string;
  serverId: string;
  type: string;
  sequenceNumber?: number | null;
  annotations?: {
    firstFaultDetail?: { errorType?: string; serveEffect?: string; direction?: string } | null;
    rallyDetails?: any;
    rallyLength?: number;
    isFirstServe?: boolean;
    isSecondServe?: boolean;
    note?: string;
  } | null;
  timestamp?: string | Date;
}

/** Campo defensivo: alguns servidores podem devolver além do schema atual. */
type MatchDataWithSequence = MatchData & {
  lastPointSequence?: number;
  lastScoreEdit?: {
    id: string;
    editedAt: string | Date;
    newScoreState: unknown;
  } | null;
  activeLogsSinceEdit?: ActiveLogSummary[];
};

interface MatchFetchDeps {
  matchId: string;
  tokenRef: React.MutableRefObject<string | null>;
  matchVersionRef: React.MutableRefObject<number | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  openRef: React.MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >;
  setMatch: (match: MatchData) => void;
  setScoreState: (action: ScoreAction) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

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
        const config = {
          format: data.format as TennisFormat,
          player1Id: data.player1.id,
          player2Id: data.player2.id,
          initialServerId: data.initialServerId || data.player1.id,
        };

        const previousHistory = engineRef.current?.getPointHistory?.() ?? [];
        let rehydratedViaLogs = false;

        const hasActiveLogs = Array.isArray(data.activeLogsSinceEdit) && data.activeLogsSinceEdit.length > 0;
        if (hasActiveLogs) {
          try {
            let rehydratedEngine: ScoringEngine;
            if (data.lastScoreEdit?.newScoreState) {
              rehydratedEngine = ScoringEngine.fromSerialized(config, JSON.stringify(data.lastScoreEdit.newScoreState));
            } else {
              rehydratedEngine = new ScoringEngine(config);
            }

            for (const log of data.activeLogsSinceEdit!) {
              const ann = log.annotations;
              const firstFaultDetail = ann?.firstFaultDetail ?? null;
              const isSecondServe =
                log.type === 'DOUBLE_FAULT' ||
                Boolean(firstFaultDetail) ||
                ann?.isSecondServe === true ||
                ann?.isFirstServe === false;
              const isFirstServe = !isSecondServe;

              rehydratedEngine.applyPoint({
                winnerId: log.winnerId,
                type: log.type,
                serverId: log.serverId,
                timestamp: log.timestamp ? new Date(log.timestamp).getTime() : Date.now(),
                isFirstServe,
                isSecondServe,
                firstFault: log.type === 'FAULT_FIRST',
                firstFaultDetail,
                rallyDetails: ann?.rallyDetails ?? null,
                rallyLength: ann?.rallyLength,
              });
            }

            engineRef.current = rehydratedEngine;
            rehydratedViaLogs = true;
          } catch (replayError) {
            logger.warn('[MATCH FETCH] Replay de activeLogsSinceEdit falhou; caindo para fromSerialized:', replayError);
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
