import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/core/scoring/engine';
import type { MatchData } from '@/hooks/useScoringHandlers';
import type { HistoryEntry, ScoringEngineConfig, ScoringState } from '@/core/scoring/types';

export async function syncOfflinePoint(
  matchId: string,
  token: string | null,
  entry: HistoryEntry,
): Promise<void> {
  if (!entry?.point?.winnerId || !entry?.point?.type || !entry?.point?.serverId) {
    logger.warn('[suspended session resume] Skipping invalid offline point:', entry);
    return;
  }
  await fetch(`/api/matches/${matchId}/point`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      winnerId: entry.point.winnerId,
      type: entry.point.type,
      serverId: entry.point.serverId,
      isFirstServe: entry.point.isFirstServe ?? true,
      isSecondServe: entry.point.isSecondServe ?? false,
      timestamp: entry.point.timestamp ?? Date.now(),
      ...(entry.point.rallyDetails != null ? { rallyDetails: entry.point.rallyDetails } : {}),
      ...(entry.point.rallyLength != null ? { rallyLength: entry.point.rallyLength } : {}),
    }),
  });
}

export async function syncOfflinePoints(
  matchId: string,
  token: string | null,
  points: HistoryEntry[],
): Promise<void> {
  for (const entry of points) {
    try {
      await syncOfflinePoint(matchId, token, entry);
    } catch (error) {
      logger.error('[suspended session resume] Failed to sync offline point:', error);
    }
  }
}

export async function restoreFreshScoreState(
  matchId: string,
  token: string | null,
  engineConfig: ScoringEngineConfig,
  engineRef: React.MutableRefObject<ScoringEngine | null>,
  setScoreState: (state: ScoringState) => void,
): Promise<void> {
  const freshRes = await fetch(`/api/matches/${matchId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!freshRes.ok) return;
  const freshData: MatchData = await freshRes.json();
  if (!freshData.scoreState) return;
  engineRef.current = ScoringEngine.fromSerialized(engineConfig, JSON.stringify(freshData.scoreState));
  setScoreState(engineRef.current.getState());
}
