import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';

export interface MatchFetchDeps {
  matchId: string;
  tokenRef: React.MutableRefObject<string | null>;
  matchVersionRef: React.MutableRefObject<number | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  engineRef: React.MutableRefObject<any>;
  openRef: React.MutableRefObject<(modal: any) => void>;
  setMatch: (match: MatchData) => void;
  setScoreState: (action: any) => void;
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
      const data: MatchData = await res.json();
      setMatch(data);

      if (typeof data.version === 'number') {
        if (matchVersionRef.current !== null && data.version < matchVersionRef.current) {
          logger.warn(`[fetchMatch] Ignoring old data (v${data.version} < v${matchVersionRef.current})`);
          setIsLoading(false);
          return;
        }
        matchVersionRef.current = data.version;
      }

      if ((data as any).lastPointSequence !== undefined) {
        pointSequenceRef.current = (data as any).lastPointSequence;
      } else if (typeof data.version === 'number') {
        pointSequenceRef.current = data.version;
      }

      if (forceEngineReset || !engineRef.current) {
        const config = {
          format: data.format as any,
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

        let scoreStateToUse: any = data.scoreState;

        if (scoreStateToUse) {
          if (typeof scoreStateToUse === 'string') {
            try {
              scoreStateToUse = JSON.parse(scoreStateToUse);
            } catch {}
          }
          if (!scoreStateToUse.setsWon) {
            scoreStateToUse.setsWon = { player1: 0, player2: 0 };
          }
          engineRef.current = ScoringEngine.fromSerialized(config, JSON.stringify(scoreStateToUse));
        } else if (data.initialServerId) {
          engineRef.current = new ScoringEngine(config);
        } else {
          openRef.current('setup');
        }

        if (engineRef.current && previousHistory.length > 0 && !Array.isArray(scoreStateToUse?.history)) {
          engineRef.current.restorePointHistory(previousHistory);
        }

        setScoreState({
          type: 'RESYNCED_FROM_SERVER',
          payload: (engineRef.current?.getState() as ScoringState) ?? null,
        });

        if (forceEngineReset && engineRef.current) {
          // Lê do engine com histórico restaurado — antes lia do engine
          // recém-criado (sempre vazio) e zerava os badges de pontos.
          const engineHistory = engineRef.current.getPointHistory();
          const synced = engineHistory.slice(-20).map((entry: any) => entry.point.winnerId);
          setPointsHistory(synced.length > 0 ? synced : []);
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
