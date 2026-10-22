import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type {
  PointFlow,
  RallyDetailsWithAttribution,
  DoublesArrangement,
  ScoringState,
} from "@/core/scoring/types";
import type { QueuedAction } from "@/schemas/rally";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { ScoreAction } from "@/hooks/useScoreReducer";

export interface MatchData {
  id: string;
  format: string;
  matchType?: 'SINGLES' | 'DOUBLES';
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  player1Partner?: { id: string; name: string } | null;
  player2Partner?: { id: string; name: string } | null;
  doublesSetup?: unknown;
  initialServerId: string | null;
  scoreState: ScoringState | null;
  state: string;
  sportType?: string;
  courtType?: string;
  startedAt?: string | Date | null;
  version?: number;
  _count?: { pointLog: number };
  recentWinnerIds?: string[];
}

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

export interface ScoringHandlersReturn {
  persistState: (
    state: ScoringState,
    label: string
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  getServerId: () => string;
  getWinnerId: (isServer: boolean) => string;
  applyPoint: (flow: PointFlow) => Promise<void>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  confirmMatchSetup: (serverId: string) => Promise<void>;
  undoLastPoint: () => void;
  returnToPreviousScreen: (serveStep: 'none' | 'second') => void;
    openAceModal: () => void;
  recordAceDirectly: () => void;

  openPointDetails: (side: "player1" | "player2") => void;
  confirmServerEffect: (
    effect?: string,
    direction?: string
  ) => void;
  confirmServeError: (
    effect?: string,
    direction?: string
  ) => void;
  recordDirectServeError: (
    errorType: "out" | "net",
    step: "first" | "second"
  ) => void;
  cancelServeError: () => void;
  confirmPointDetails: (
    details: RallyDetailsWithAttribution,
    audio?: { blob: Blob; durationMs: number }
  ) => void;
  updateDoublesArrangement?: (
    arrangement: DoublesArrangement
  ) => Promise<void>;
  isProcessing: boolean;
}