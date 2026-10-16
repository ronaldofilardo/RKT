import { logger } from '@/lib/logger';
import type { SessionData } from './session-context.types';

export const SESSION_STORAGE_KEY_PREFIX = 'rkt_session_';

interface PreservedFields {
  preservedSnapshot: string | null;
  preservedSessionId: string | null;
}

/** Reparsa a sessão existente preservando snapshot e sessionId (tolera JSON inválido). */
export function readPreservedFields(existingRaw: string | null): PreservedFields {
  let preservedSnapshot = null;
  let preservedSessionId = null;
  try {
    if (existingRaw) {
      const existing = JSON.parse(existingRaw);
      preservedSnapshot = existing.matchStateSnapshot ?? null;
      preservedSessionId = existing.suspendedSessionId ?? null;
    }
  } catch (error) {
    logger.warn('[SESSION STORAGE] Falha ao reparsar sessão existente; snapshot e sessionId não preservados:', error);
  }
  return { preservedSnapshot, preservedSessionId };
}

/** Serializa o estado atual da sessão para sessionStorage. */
export function buildStoredSession(session: SessionData, preserved: PreservedFields) {
  return {
    bankScoreState: session.bankScoreState,
    matchStateSnapshot: session.matchStateSnapshot ?? preserved.preservedSnapshot,
    snapshotStatus: session.snapshotStatus,
    snapshotPointCount: session.snapshotPointCount,
    bankPointCount: session.bankPointCount,
    suspendedSessionId: session.suspendedSessionId ?? preserved.preservedSessionId,
  };
}

/** Converte o JSON armazenado no payload de sessão (lança em JSON inválido). */
export function parseStoredSessionPayload(matchId: string, stored: string): Omit<SessionData, 'pendingEditScore'> {
  const parsed = JSON.parse(stored);
  return {
    matchId,
    sessionId: parsed.suspendedSessionId ?? null,
    bankScoreState: parsed.bankScoreState ?? null,
    matchStateSnapshot: parsed.matchStateSnapshot ?? null,
    snapshotStatus: parsed.snapshotStatus ?? 'IN_SYNC',
    snapshotPointCount: parsed.snapshotPointCount ?? 0,
    bankPointCount: parsed.bankPointCount ?? 0,
    suspendedSessionId: parsed.suspendedSessionId ?? null,
  };
}
