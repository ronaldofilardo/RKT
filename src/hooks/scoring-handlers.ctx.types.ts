import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { QueuedAction } from "@/schemas/rally";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "./scoring-handlers.match.types";

export interface ScoringHandlersContext {
  matchId: string;
  match: MatchData | null;
  isOnline: boolean;
  enqueue: (
    action: Omit<QueuedAction, "id" | "status" | "retries">
  ) => Promise<QueuedAction>;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  modalParamsRef: MutableRefObject<Record<string, string>>;
  openRef: MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >;
  pointSequenceRef: MutableRefObject<number>;

  serveErrorState: ScoreboardUIState;

  setMatch: Dispatch<SetStateAction<MatchData | null>>;
  setScoreState: Dispatch<ScoreAction>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSetupLoading: Dispatch<SetStateAction<boolean>>;
  setPointsHistory: Dispatch<SetStateAction<string[]>>;
  setShowFinishedBanner: Dispatch<SetStateAction<boolean>>;

  closeServeErrorModal: () => void;
  openServeErrorModal: (type: 'out' | 'net', step: 'first' | 'second') => void;
  setFirstServeError: (err: {
    errorType: "out" | "net";
    serveEffect?: string;
    direction?: string;
  }) => void;
  clearFirstServeError: () => void;
  setServeStep: (step: "none" | "second") => void;

  open: (modal: string, params?: Record<string, string>) => void;
  close: () => void;
  closeAll: () => void;
  onUndoComplete?: () => void;
  onPointProcessed?: () => void;
  onAudioUploaded?: () => void;
  removeLastAction?: (matchId: string) => Promise<boolean>;
  isProcessingRef: MutableRefObject<boolean>;
  debounceTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}
