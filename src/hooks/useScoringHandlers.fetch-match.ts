import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';

type FetchMatchDeps = {
  matchId: string;
  tokenRef: { current: string | null };
  engineRef: { current: ScoringEngine | null };
  openRef: { current: (modal: string, params?: Record<string, string>) => void };
  pointSequenceRef: { current: number };
  setMatch: (value: MatchData) => void;
  setScoreState: (value: ScoringState | null) => void;
  setIsLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  setPointsHistory: (value: string[]) => void;
};

async function getMatchResponse(matchId: string, token: string | null): Promise<MatchData> {
  const response = await fetch(`/api/matches/${matchId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ao buscar partida: ${response.status}`);
  }
  return response.json() as Promise<MatchData>;
}

function updatePointSequence(data: MatchData, pointSequenceRef: FetchMatchDeps['pointSequenceRef']) {
  if (data._count && typeof data._count.pointLog === 'number') pointSequenceRef.current = data._count.pointLog;
  else if (typeof data.version === 'number') pointSequenceRef.current = data.version;
}

function parseScoreState(data: MatchData): any {
  let scoreState: any = data.scoreState;
  if (scoreState && typeof scoreState === 'string') {
    try { scoreState = JSON.parse(scoreState); } catch {}
  }
  if (scoreState && !scoreState.setsWon) scoreState.setsWon = { player1: 0, player2: 0 };
  return scoreState;
}

function buildEngineConfig(data: MatchData) {
  return {
    format: data.format as any,
    player1Id: data.player1.id,
    player2Id: data.player2.id,
    initialServerId: data.initialServerId || data.player1.id,
  };
}

function initializeEngine(data: MatchData, deps: FetchMatchDeps) {
  const config = buildEngineConfig(data);
  const scoreState = parseScoreState(data);
  if (scoreState) deps.engineRef.current = ScoringEngine.fromSerialized(config, JSON.stringify(scoreState));
  else if (data.initialServerId) deps.engineRef.current = new ScoringEngine(config);
  else deps.openRef.current('setup');
}

function syncPointHistory(forceEngineReset: boolean, deps: FetchMatchDeps) {
  if (!forceEngineReset || !deps.engineRef.current) return;
  const synced = deps.engineRef.current.getPointHistory().slice(-20).map((entry) => entry.point.winnerId);
  deps.setPointsHistory(synced.length > 0 ? synced : []);
}

export function createFetchMatch(deps: FetchMatchDeps) {
  return async (forceEngineReset = false) => {
    try {
      const data = await getMatchResponse(deps.matchId, deps.tokenRef.current);
      deps.setMatch(data);
      updatePointSequence(data, deps.pointSequenceRef);
      if (forceEngineReset || !deps.engineRef.current) {
        initializeEngine(data, deps);
        deps.setScoreState((deps.engineRef.current?.getState() as ScoringState) ?? null);
        syncPointHistory(forceEngineReset, deps);
      }
      deps.setIsLoading(false);
    } catch (error) {
      logger.error('[fetchMatch]', error);
      deps.setError('Erro ao carregar partida');
      deps.setIsLoading(false);
    }
  };
}
