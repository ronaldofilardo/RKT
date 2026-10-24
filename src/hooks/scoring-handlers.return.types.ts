import type { ScoringState, PointFlow, RallyDetailsWithAttribution, DoublesArrangement } from "@/core/scoring/types";

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
