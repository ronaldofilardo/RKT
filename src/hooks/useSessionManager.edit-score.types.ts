import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { HistoryEntry, ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/core/scoring/edit-score-domain";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "@/hooks/useScoringHandlers";
import type { SessionManagerContext, SuspendedSessionState } from "./useSessionManager";

export interface ExecuteEditScoreOptions {
  setResults: SetEditData[];
  server: "player1" | "player2";
  note?: string;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  ctx: SessionManagerContext;
  match: MatchData | null;
  matchId: string;
  tokenRef: MutableRefObject<string | null>;
  engineRef: MutableRefObject<ScoringEngine | null>;
  suspendedSession: SuspendedSessionState | null;
  persistState: (
    state: ScoringState,
    label: string,
    persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; history?: HistoryEntry[]; note?: string },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  setScoreState: Dispatch<ScoreAction>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  abandonCurrentSession: () => Promise<boolean>;
  toast: (options: { type: 'success' | 'error' | 'info'; message: string }) => void;
}
