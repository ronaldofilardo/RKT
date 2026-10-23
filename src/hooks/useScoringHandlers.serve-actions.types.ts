import type { ScoringEngine } from "@/core/scoring/engine";
import type { PointFlow } from "@/core/scoring/types";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { MatchData } from "./useScoringHandlers.types";
import type { createModalHandlersService } from "./useScoringHandlers.modals.service";

export interface ServeActionsDeps {
  match: MatchData | null;
  serveErrorState: ScoreboardUIState;
  serverHelpers: {
    getServerId: () => string;
    getWinnerId: (isServerWinner: boolean) => string;
  };
  modalService: ReturnType<typeof createModalHandlersService>;
  applyPoint: (flow: PointFlow) => Promise<string | undefined>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  closeAll: () => void;
  setFirstServeError: (val: {
    errorType: "out" | "net";
    serveEffect?: string;
    direction?: string;
  }) => void;
  clearFirstServeError: () => void;
  openServeErrorModal: (
    errorType: "out" | "net",
    step: "first" | "second",
  ) => void;
  closeServeErrorModal: () => void;
  setServeStep: (step: "none" | "second") => void;
}
