import { logger } from '@/lib/logger';
import type { HistoryEntry } from '@/core/scoring/types';

/**
 * Busca a sequência atual do servidor antes de replayar pontos.
 * Cada ponto offline precisa de um sequenceNumber válido e um
 * clientEventId para dedup (evitar duplicação em caso de retry).
 */
export async function fetchServerSequence(
  matchId: string,
  getToken: () => string | null,
  signal?: AbortSignal,
): Promise<number> {
  try {
    const seqRes = await fetch(`/api/matches/${matchId}`, {
      headers: { authorization: `Bearer ${getToken()}` },
      signal,
    });
    if (seqRes.ok) {
      const seqData = await seqRes.json();
      return seqData._count?.pointLog ?? seqData.version ?? 0;
    }
    return 0;
  } catch (error) {
    logger.warn('[SUSPENDED RESUME] Falha ao obter sequence do servidor; replay inicia em 0:', error);
    return 0;
  }
}

export interface OfflineReplayParams {
  matchId: string;
  bankPointCount: number;
  serverSequence: number;
  getToken: () => string | null;
  history: HistoryEntry[];
  signal?: AbortSignal;
}

/** Reposta cada ponto offline gravado no snapshot, em ordem. */
export async function replayOfflinePoints(params: OfflineReplayParams): Promise<void> {
  const { matchId, bankPointCount, serverSequence, getToken, history, signal } = params;
  const offlinePoints = history.slice(bankPointCount);

  for (let i = 0; i < offlinePoints.length; i++) {
    const entry = offlinePoints[i];
    try {
      if (!entry?.point?.winnerId || !entry?.point?.type || !entry?.point?.serverId) {
        logger.warn('[suspended session resume] Skipping invalid offline point:', entry);
        continue;
      }

      const sequenceNumber = serverSequence + i + 1;
      const clientEventId = `resume-${matchId}-${bankPointCount + i}`;

      await fetch(`/api/matches/${matchId}/point`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          winnerId: entry.point.winnerId,
          type: entry.point.type,
          serverId: entry.point.serverId,
          isFirstServe: entry.point.isFirstServe ?? true,
          isSecondServe: entry.point.isSecondServe ?? false,
          timestamp: entry.point.timestamp ?? Date.now(),
          sequenceNumber,
          clientEventId,
          ...(entry.point.rallyDetails != null ? { rallyDetails: entry.point.rallyDetails } : {}),
          ...(entry.point.rallyLength != null ? { rallyLength: entry.point.rallyLength } : {}),
          ...(entry.point.firstFaultDetail != null ? { firstFaultDetail: entry.point.firstFaultDetail } : {}),
        }),
        signal,
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      logger.error('[suspended session resume] Failed to sync offline point:', err);
    }
  }
}
