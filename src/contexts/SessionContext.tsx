'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ScoringState } from '@/core/scoring/types';
import type { SnapshotStatus } from '@/lib/snapshot-utils';
import type { MatchData } from '@/hooks/useScoringHandlers';

export interface SessionData {
  matchId: string | null;
  sessionId: string | null;
  bankScoreState: ScoringState | null;
  matchStateSnapshot: string | null;
  snapshotStatus: SnapshotStatus;
  snapshotPointCount: number;
  bankPointCount: number;
  suspendedSessionId: string | null;
  pendingEditScore: {
    scoreState: ScoringState;
    floorSets: { player1: number; player2: number } | null;
  } | null;
}

type SessionAction =
  | { type: 'SET_SESSION'; payload: Omit<SessionData, 'pendingEditScore'> }
  | { type: 'SET_PENDING_EDIT'; payload: { scoreState: ScoringState; floorSets: { player1: number; player2: number } | null } }
  | { type: 'CLEAR_PENDING_EDIT' }
  | { type: 'UPDATE_SCORE'; payload: ScoringState }
  | { type: 'ABANDON'; payload: { matchId: string; sessionId: string; snapshot: string; snapshotStatus: SnapshotStatus; snapshotPointCount: number; bankPointCount: number; suspendedSessionId: string | null } }
  | { type: 'RESUME_COMPLETE' }
  | { type: 'CLEAR' };

const initialState: SessionData = {
  matchId: null,
  sessionId: null,
  bankScoreState: null,
  matchStateSnapshot: null,
  snapshotStatus: 'IN_SYNC',
  snapshotPointCount: 0,
  bankPointCount: 0,
  suspendedSessionId: null,
  pendingEditScore: null,
};

function sessionReducer(state: SessionData, action: SessionAction): SessionData {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, ...action.payload };
    case 'SET_PENDING_EDIT':
      return { ...state, pendingEditScore: action.payload };
    case 'CLEAR_PENDING_EDIT':
      return { ...state, pendingEditScore: null };
    case 'UPDATE_SCORE':
      return { ...state, bankScoreState: action.payload };
    case 'ABANDON': {
      return {
        ...state,
        sessionId: action.payload.sessionId,
        matchStateSnapshot: action.payload.snapshot,
        snapshotStatus: action.payload.snapshotStatus,
        snapshotPointCount: action.payload.snapshotPointCount,
        bankPointCount: action.payload.bankPointCount,
        suspendedSessionId: action.payload.suspendedSessionId,
      };
    }
    case 'RESUME_COMPLETE':
      return {
        ...state,
        matchId: null,
        matchStateSnapshot: null,
        suspendedSessionId: null,
      };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface SessionContextValue {
  session: SessionData;
  setSession: (data: Omit<SessionData, 'pendingEditScore'>) => void;
  setPendingEdit: (scoreState: ScoringState, floorSets: { player1: number; player2: number } | null) => void;
  clearPendingEdit: () => void;
  updateScore: (score: ScoringState) => void;
  abandon: (data: { matchId: string; sessionId: string; snapshot: string; snapshotStatus: SnapshotStatus; snapshotPointCount: number; bankPointCount: number; suspendedSessionId: string | null }) => void;
  resumeComplete: () => void;
  clearSession: () => void;
  writeToSessionStorage: (matchId: string) => void;
  restoreFromSessionStorage: (matchId: string) => boolean;
  isSessionActive: (matchId: string) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_STORAGE_KEY_PREFIX = 'rkt_session_';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initialState);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = sessionStorage.getItem('access_token');
  }, []);

  const setSession = useCallback((data: Omit<SessionData, 'pendingEditScore'>) => {
    dispatch({ type: 'SET_SESSION', payload: data });
  }, []);

  const setPendingEdit = useCallback((scoreState: ScoringState, floorSets: { player1: number; player2: number } | null) => {
    dispatch({ type: 'SET_PENDING_EDIT', payload: { scoreState, floorSets } });
  }, []);

  const clearPendingEdit = useCallback(() => {
    dispatch({ type: 'CLEAR_PENDING_EDIT' });
  }, []);

  const updateScore = useCallback((score: ScoringState) => {
    dispatch({ type: 'UPDATE_SCORE', payload: score });
  }, []);

  const abandon = useCallback((data: { matchId: string; sessionId: string; snapshot: string; snapshotStatus: SnapshotStatus; snapshotPointCount: number; bankPointCount: number; suspendedSessionId: string | null }) => {
    dispatch({ type: 'ABANDON', payload: data });
    sessionStorage.setItem('last_abandon_timestamp', Date.now().toString());
    const blob = new Blob([JSON.stringify({ matchStateSnapshot: data.snapshot })], { type: 'application/json' });
    navigator.sendBeacon(`/api/matches/${data.matchId}/sessions/${data.sessionId}/abandon`, blob);
  }, []);

  const resumeComplete = useCallback(() => {
    dispatch({ type: 'RESUME_COMPLETE' });
  }, []);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    if (session.matchId) {
      sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${session.matchId}`);
    }
  }, [session.matchId]);

  const writeToSessionStorage = useCallback((matchId: string) => {
    const existingStored = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
    let preservedSnapshot = null;
    let preservedSessionId = null;
    try {
      if (existingStored) {
        const existing = JSON.parse(existingStored);
        preservedSnapshot = existing.matchStateSnapshot ?? null;
        preservedSessionId = existing.suspendedSessionId ?? null;
      }
    } catch {}
    sessionStorage.setItem(
      `${SESSION_STORAGE_KEY_PREFIX}${matchId}`,
      JSON.stringify({
        bankScoreState: session.bankScoreState,
        matchStateSnapshot: session.matchStateSnapshot ?? preservedSnapshot,
        snapshotStatus: session.snapshotStatus,
        snapshotPointCount: session.snapshotPointCount,
        bankPointCount: session.bankPointCount,
        suspendedSessionId: session.suspendedSessionId ?? preservedSessionId,
      }),
    );
  }, [session]);

  const restoreFromSessionStorage = useCallback((matchId: string): boolean => {
    const stored = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      dispatch({
        type: 'SET_SESSION',
        payload: {
          matchId,
          sessionId: parsed.suspendedSessionId ?? null,
          bankScoreState: parsed.bankScoreState ?? null,
          matchStateSnapshot: parsed.matchStateSnapshot ?? null,
          snapshotStatus: parsed.snapshotStatus ?? 'IN_SYNC',
          snapshotPointCount: parsed.snapshotPointCount ?? 0,
          bankPointCount: parsed.bankPointCount ?? 0,
          suspendedSessionId: parsed.suspendedSessionId ?? null,
        },
      });
      sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${matchId}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isSessionActive = useCallback((matchId: string): boolean => {
    return session.matchId === matchId && session.matchStateSnapshot !== null;
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        setPendingEdit,
        clearPendingEdit,
        updateScore,
        abandon,
        resumeComplete,
        clearSession,
        writeToSessionStorage,
        restoreFromSessionStorage,
        isSessionActive,
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