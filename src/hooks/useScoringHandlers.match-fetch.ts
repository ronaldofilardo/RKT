import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { HistoryEntry, ScoringState, TennisFormat } from '@/core/scoring/types';
import type { ScoreAction } from '@/hooks/useScoreReducer';
import type { MatchData } from './useScoringHandlers.types';

/** Envelope que o servidor pode devolver no `scoreState` (ver persistStateWithRetry). */
type ScoreStateEnvelope = { state?: ScoringState; history?: HistoryEntry[] };

/** Campo defensivo: alguns servidores podem devolver além do schema atual. */
type MatchDataWithSequence = MatchData & { lastPointSequence?: number };

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

        // BUG FIX (Voltar inativo): o scoreState do servidor não inclui o
        // array `history`, então o engine recriado nasce com histórico vazio
        // → getHistoryLength() === 0 → botão "Voltar" desabilitado mesmo com
        // pontos registrados (ex.: após offline-sync-complete ou resync).
        // Capturar o histórico do engine anterior antes de substituí-lo,
        // no mesmo padrão de applySuccessResult (point-processor.service).
        const previousHistory = engineRef.current?.getPointHistory?.() ?? [];

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

        // BUG FIX (2026-09-27) — timeline "cortada" em /scoring: a condição
        // acima só restaurava previousHistory quando o servidor não mandava
        // NENHUM array `history` — mas matches antigos/ainda não corrigidos
        // no servidor (ver restoreEngineFromMatch em route.logic.ts)
        // podiam persistir um `history` que É um array, só que incompleto
        // (ex.: só o último ponto). Nesse caso a engine recém-criada ficava
        // com um histórico mais curto do que o engine anterior já tinha em
        // memória, e a timeline (alimentada por getPointHistory()) exibia
        // menos pontos do que os realmente jogados até um novo ponto local
        // reconstruir o resto. Agora comparamos os tamanhos e mantemos o
        // histórico mais completo dos dois.
        const serverHistoryLength = Array.isArray((scoreStateToUse as ScoreStateEnvelope | null)?.history)
          ? ((scoreStateToUse as ScoreStateEnvelope).history as HistoryEntry[]).length
          : 0;
        if (engineRef.current && previousHistory.length > serverHistoryLength) {
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
