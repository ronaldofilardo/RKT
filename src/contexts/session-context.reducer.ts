import type { SessionData, SessionAction } from './session-context.types';

export const initialState: SessionData = {
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

export function sessionReducer(state: SessionData, action: SessionAction): SessionData {
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
