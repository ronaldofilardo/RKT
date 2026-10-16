'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ScoringState } from '@/core/scoring/types';
import type { SnapshotStatus } from '@/lib/snapshot-utils';
import type { SessionData, SessionContextValue, AbandonPayload } from './session-context.types';
import { sessionReducer, initialState } from './session-context.reducer';
import { SESSION_STORAGE_KEY_PREFIX, readPreservedFields, buildStoredSession, parseStoredSessionPayload } from './session-storage.helpers';

export type { SessionData } from './session-context.types';

const SessionContext = createContext<SessionContextValue | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initialState);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = sessionStorage.getItem('access_token');
  }, []);

  const setSession = useCallback((data: Omit<SessionData, 'pendingEditScore'>) => dispatch({ type: 'SET_SESSION', payload: data }), []);
  const setPendingEdit = useCallback((scoreState: ScoringState, floorSets: { player1: number; player2: number } | null) => dispatch({ type: 'SET_PENDING_EDIT', payload: { scoreState, floorSets } }), []);
  const clearPendingEdit = useCallback(() => dispatch({ type: 'CLEAR_PENDING_EDIT' }), []);
  const updateScore = useCallback((score: ScoringState) => dispatch({ type: 'UPDATE_SCORE', payload: score }), []);

  const abandon = useCallback((data: AbandonPayload) => {
    dispatch({ type: 'ABANDON', payload: data });
    sessionStorage.setItem('last_abandon_timestamp', Date.now().toString());
    const blob = new Blob([JSON.stringify({ matchStateSnapshot: data.snapshot })], { type: 'application/json' });
    navigator.sendBeacon(`/api/matches/${data.matchId}/sessions/${data.sessionId}/abandon`, blob);
  }, []);

  const resumeComplete = useCallback(() => dispatch({ type: 'RESUME_COMPLETE' }), []);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    if (session.matchId) sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${session.matchId}`);
  }, [session.matchId]);

  const writeToSessionStorage = useCallback((matchId: string) => {
    const raw = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
    const preserved = readPreservedFields(raw);
    sessionStorage.setItem(
      `${SESSION_STORAGE_KEY_PREFIX}${matchId}`,
      JSON.stringify(buildStoredSession(session, preserved)),
    );
  }, [session]);

  const restoreFromSessionStorage = useCallback((matchId: string): boolean => {
    const stored = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
    if (!stored) return false;
    try {
      dispatch({ type: 'SET_SESSION', payload: parseStoredSessionPayload(matchId, stored) });
      sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isSessionActive = useCallback((matchId: string) => session.matchId === matchId && session.matchStateSnapshot !== null, [session]);

  return (
    <SessionContext.Provider
      value={{
        session, setSession, setPendingEdit, clearPendingEdit, updateScore, abandon, resumeComplete, clearSession,
        writeToSessionStorage, restoreFromSessionStorage, isSessionActive,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}

export function useSessionForMatch(matchId: string) {
  const { session, setSession, setPendingEdit, clearPendingEdit, updateScore, abandon, resumeComplete, writeToSessionStorage, restoreFromSessionStorage, isSessionActive } = useSession();
  return {
    session,
    isActive: isSessionActive(matchId),
    setSession: (data: Omit<SessionData, 'pendingEditScore'>) => setSession({ ...data, matchId }),
    setPendingEdit,
    clearPendingEdit,
    updateScore,
    abandon: (sessionId: string, snapshot: string, snapshotStatus: SnapshotStatus, snapshotPointCount: number, bankPointCount: number, suspendedSessionId: string | null) =>
      abandon({ matchId, sessionId, snapshot, snapshotStatus, snapshotPointCount, bankPointCount, suspendedSessionId }),
    resumeComplete,
    writeToSessionStorage,
    restoreFromSessionStorage: () => restoreFromSessionStorage(matchId),
  };
}
