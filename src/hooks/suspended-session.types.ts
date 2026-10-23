import type { ScoringEngine } from '@/core/scoring/engine';
import type { SuspendedSessionState } from './useSessionManager';
import type { MatchData } from '@/hooks/useScoringHandlers';
import type { ScoreAction } from '@/hooks/useScoreReducer';

export interface SuspendedSessionConfig {
  suspendedSession: SuspendedSessionState | null;
  match: MatchData | null;
  matchId: string;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  sessionIdRef: React.MutableRefObject<string | null>;
  tokenRef: React.MutableRefObject<string | null>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  setScoreState: (action: ScoreAction) => void;
  setSessionActive: (active: boolean) => void;
  setSuspendedSession: (state: SuspendedSessionState | null) => void;
  setFloorCurrentSets: (sets: { player1: number; player2: number } | null) => void;
  clearPendingEdit: () => void;
  startSession: (matchId: string, createNew: boolean) => Promise<{ id: string }>;
}
