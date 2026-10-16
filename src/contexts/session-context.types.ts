import type { ScoringState } from '@/core/scoring/types';
import type { SnapshotStatus } from '@/lib/snapshot.logic';

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

/** Payload do ABANDON: espelhado em SessionContextValue.abandon. */
export interface AbandonPayload {
  matchId: string;
  sessionId: string;
  snapshot: string;
  snapshotStatus: SnapshotStatus;
  snapshotPointCount: number;
  bankPointCount: number;
  suspendedSessionId: string | null;
}

export type SessionAction =
  | { type: 'SET_SESSION'; payload: Omit<SessionData, 'pendingEditScore'> }
  | { type: 'SET_PENDING_EDIT'; payload: { scoreState: ScoringState; floorSets: { player1: number; player2: number } | null } }
  | { type: 'CLEAR_PENDING_EDIT' }
  | { type: 'UPDATE_SCORE'; payload: ScoringState }
  | { type: 'ABANDON'; payload: AbandonPayload }
  | { type: 'RESUME_COMPLETE' }
  | { type: 'CLEAR' };

export interface SessionContextValue {
  session: SessionData;
  setSession: (data: Omit<SessionData, 'pendingEditScore'>) => void;
  setPendingEdit: (scoreState: ScoringState, floorSets: { player1: number; player2: number } | null) => void;
  clearPendingEdit: () => void;
  updateScore: (score: ScoringState) => void;
  abandon: (data: AbandonPayload) => void;
  resumeComplete: () => void;
  clearSession: () => void;
  writeToSessionStorage: (matchId: string) => void;
  restoreFromSessionStorage: (matchId: string) => boolean;
  isSessionActive: (matchId: string) => boolean;
}
