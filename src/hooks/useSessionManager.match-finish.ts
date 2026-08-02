"use client";
import { logger } from "@/lib/logger";

import type { ScoringState } from "@/core/scoring/types";

interface MatchFinishConfig {
  matchId: string;
  tokenRef: React.MutableRefObject<string | null>;
}

export async function finishMatch(
  config: MatchFinishConfig,
  winnerId: string,
  scoreState: ScoringState
): Promise<{ success: boolean; error?: string }> {
  const { matchId, tokenRef } = config;

  try {
    const token = tokenRef.current;
    const response = await fetch(`/api/matches/${matchId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        winnerId: winnerId,
        scoreState: scoreState,
        reason: 'COMPLETED',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update match winner');
    }

    const result = await response.json();
    logger.log('Match finished successfully:', result.match);
    return { success: true };
  } catch (err) {
    logger.error('Failed to update match winner:', err);
    
    const isOffline = !navigator.onLine;
    if (isOffline || (err instanceof TypeError && err.message === 'Failed to fetch')) {
      saveMatchFinishForOfflineSync(matchId, winnerId);
      return { success: true, error: 'offline' };
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar partida';
    return { success: false, error: errorMessage };
  }
}

import { appendPendingMatchSync } from "@/lib/offlineStorageSync";

function saveMatchFinishForOfflineSync(
  matchId: string,
  winnerId: string
): void {
  const pendingSync = {
    matchId,
    winnerId,
    finishedAt: new Date().toISOString(),
    timestamp: Date.now(),
    type: 'MATCH_FINISH' as const,
  };

  appendPendingMatchSync(pendingSync);

  logger.log('Match finish saved for offline sync:', pendingSync);
}
