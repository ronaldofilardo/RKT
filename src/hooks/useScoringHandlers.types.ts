import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";

export interface MatchData {
  id: string;
  format: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  initialServerId: string | null;
  scoreState: ScoringState | null;
  state: string;
  sportType?: string;
  courtType?: string;
  version?: number;
  includeLet?: boolean;
}

export interface ScoringHandlersContext {
  matchId: string;
  match: MatchData | null;
  isOnline: boolean;
  enqueue: (action: {
    matchId: string;
    type: "POINT";
    payload: any;
    timestamp: number;
  }) => Promise<any>;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  modalParamsRef: MutableRefObject<Record<string, string>>;
  openRef: MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >;
  pointSequenceRef: MutableRefObject<number>;

  serveErrorState: ScoreboardUIState;

  setMatch: Dispatch<SetStateAction<MatchData | null>>;
  setScoreState: Dispatch<SetStateAction<ScoringState | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSetupLoading: Dispatch<SetStateAction<boolean>>;
  setPointsHistory: Dispatch<SetStateAction<string[]>>;
  setShowFinishedBanner: Dispatch<SetStateAction<boolean>>;

  handleServeErrorClose: () => void;
  handleFirstServeErrorSet: (err: {
    errorType: "out" | "net";
    serveEffect?: string;
    direction?: string;
  }) => void;
  handleFirstServeErrorClear: () => void;
  setServeStep: (step: "none" | "second") => void;

  open: (modal: string, params?: Record<string, string>) => void;
  close: () => void;
  closeAll: () => void;
  onUndoComplete?: () => void;
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
  processPoint: (flow: any) => Promise<void>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  handleSetupConfirm: (serverId: string) => Promise<void>;
  handleUndo: () => void;
  handleLet: () => void;
  handleCancelSecondServe: () => void;
  openAceModal: () => void;
  openPointDetails: (side: "player1" | "player2") => void;
  handleServerEffectConfirm: (
    effect?: string,
    direction?: string
  ) => void;
  handleServeErrorConfirm: (
    effect?: string,
    direction?: string
  ) => void;
  handleServeCancel: () => void;
  handleServeErrorCancel: () => void;
  handlePointDetailsConfirm: (details: any) => void;
  isProcessing: boolean;
}