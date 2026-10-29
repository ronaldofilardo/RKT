import type { SpectatorFeedStatus } from './types';

export const SPECTATE_HEARTBEAT_THRESHOLD_MS = 30_000; // 30s sem sinal = NO_SIGNAL
export const SPECTATE_CATCH_UP_DELAY_THRESHOLD_MS = 30_000;

export interface CalculateSignalParams {
  matchState: string;
  hasActiveSession: boolean;
  totalPoints?: number;
  lastHeartbeatAt?: Date | string | null;
  lastPointReceivedAt?: Date | string | null;
  nowMs: number;
  catchUpCount?: number;
}

export interface SignalStatusResult {
  status: SpectatorFeedStatus;
  lastSignalAt: number | null;
  ageSeconds: number | null;
}

function resolveLastSignalMs(
  lastHeartbeatAt?: Date | string | null,
  lastPointReceivedAt?: Date | string | null
): number | null {
  const hbMs = lastHeartbeatAt ? new Date(lastHeartbeatAt).getTime() : 0;
  const ptMs = lastPointReceivedAt ? new Date(lastPointReceivedAt).getTime() : 0;
  const max = Math.max(hbMs, ptMs);
  return max > 0 ? max : null;
}

/**
 * Calcula determinísticamente o status de sinal do feed para o espectador.
 * Função pura, isolada de I/O e relógio de sistema.
 */
export function calculateSignalStatus(params: CalculateSignalParams): SignalStatusResult {
  const { matchState, hasActiveSession, totalPoints, lastHeartbeatAt, lastPointReceivedAt, nowMs, catchUpCount = 0 } = params;

  if (matchState === 'FINISHED' || matchState === 'CANCELLED') {
    return { status: 'FINISHED', lastSignalAt: null, ageSeconds: null };
  }

  if (matchState === 'SCHEDULED' || totalPoints === 0) {
    return { status: 'NOT_STARTED', lastSignalAt: null, ageSeconds: null };
  }

  // Mapeado quando MatchAnnotationSession estiver suspensa/inativa sem que a partida tenha sido finalizada
  if (!hasActiveSession) {
    return { status: 'PAUSED', lastSignalAt: null, ageSeconds: null };
  }

  const lastSignalAt = resolveLastSignalMs(lastHeartbeatAt, lastPointReceivedAt);
  if (!lastSignalAt) {
    return { status: 'LIVE', lastSignalAt: null, ageSeconds: null };
  }

  const ageMs = Math.max(0, nowMs - lastSignalAt);
  const ageSeconds = Math.floor(ageMs / 1000);

  if (ageMs > SPECTATE_HEARTBEAT_THRESHOLD_MS) {
    return { status: 'NO_SIGNAL', lastSignalAt, ageSeconds };
  }

  if (catchUpCount >= 2) {
    return { status: 'CATCH_UP', lastSignalAt, ageSeconds };
  }

  return { status: 'LIVE', lastSignalAt, ageSeconds };
}
