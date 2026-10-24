"use client";
import { logger } from "@/lib/logger";

import type { ScoringState } from "@/core/scoring/types";

interface MatchFinishConfig {
  matchId: string;
  tokenRef?: React.MutableRefObject<string | null>;
  matchVersion?: number | null;
}

export interface MatchFinishResult {
  success: boolean;
  status?: number;
  code?: string;
  error?: string;
}

export async function finishMatch(
  config: MatchFinishConfig,
  winnerId: string,
  scoreState: ScoringState,
  options?: { isManualScoreEdit?: boolean; note?: string }
): Promise<MatchFinishResult> {
  const { matchId, matchVersion } = config;

  try {
    const response = await fetch(`/api/matches/${matchId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        winnerId: winnerId,
        scoreState: scoreState,
        reason: 'COMPLETED',
        ...(matchVersion != null ? { version: matchVersion } : {}),
        ...(options?.isManualScoreEdit ? { isManualScoreEdit: true } : {}),
        ...(options?.note ? { note: options.note } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        code: errorData.error,
        error: errorData.error || 'Failed to update match winner',
      };
    }

    return { success: true, status: response.status };
  } catch (err) {
    logger.error('Failed to update match winner:', err);
    
    const isOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || err instanceof TypeError;
    if (options?.isManualScoreEdit) {
      return { success: false, code: 'offline', error: 'Sem conexão: editar o placar exige internet.' };
    }
    if (isOffline) {
      saveMatchFinishForOfflineSync(matchId, winnerId);
      return { success: true, code: 'offline', error: 'offline' };
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
