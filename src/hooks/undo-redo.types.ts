import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { ScoreAction } from "@/hooks/useScoreReducer";

export interface UndoRedoDeps {
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setScoreState: (action: ScoreAction) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  persistState: (
    state: ScoringState,
    label: string,
    options?: {
      allowScoreEdit?: boolean;
      isManualScoreEdit?: boolean;
      voidPointLogId?: string;
      voidLastPoint?: boolean;
      isUndo?: boolean;
    },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  closeAll: () => void;
  clearFirstServeError: () => void;
  setServeStep: (step: "none" | "second") => void;
  closeServeErrorModal: () => void;
  onUndoComplete?: () => void;
  open: (modal: string, params?: Record<string, string>) => void;
}
