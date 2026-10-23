import type { ScoringEngine } from "@/core/scoring/engine";
import type { QueuedAction } from "@/schemas/rally";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { PointFlow } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers.types";
import type { createPointSyncService } from "./useScoringHandlers.point-sync";

export interface PointProcessorDeps {
  match: MatchData | null;
  isOnline: boolean;
  enqueue: (
    action: Omit<QueuedAction, "id" | "status" | "retries">
  ) => Promise<QueuedAction>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  tokenRef: React.MutableRefObject<string | null>;
  modalParamsRef: React.MutableRefObject<Record<string, string>>;
  pointSequenceRef: React.MutableRefObject<number>;
  matchVersionRef: React.MutableRefObject<number | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  serveErrorState: ScoreboardUIState;
  serverHelpers: {
    getServerId: () => string;
  };
  pointSync: ReturnType<typeof createPointSyncService>;
  closeAll: () => void;
  setScoreState: (action: ScoreAction) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>;
  setShowFinishedBanner: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  fetchMatch: (forceReset?: boolean) => Promise<void>;
  onPointProcessed?: () => void;
  onAudioUploaded?: () => void;
  uploadAudioNote?: (
    matchId: string,
    pointLogId: string,
    blob: Blob,
    durationMs: number,
    token: string | null,
  ) => Promise<void>;
  clearFirstServeError: () => void;
  setServeStep: (step: "none" | "second") => void;
}

export interface ConfirmPointDetailsDeps {
  match: MatchData | null;
  modalParamsRef: React.MutableRefObject<Record<string, string>>;
  serveErrorState: ScoreboardUIState;
  serverHelpers: {
    getServerId: () => string;
  };
  closeAll: () => void;
  isProcessingRef: React.MutableRefObject<boolean>;
  applyPoint: (flow: PointFlow) => Promise<string | undefined>;
  clearFirstServeError: () => void;
  setServeStep: (step: "none" | "second") => void;
  uploadAudioNote?: (
    matchId: string,
    pointLogId: string,
    blob: Blob,
    durationMs: number,
    token: string | null,
  ) => Promise<void>;
  tokenRef: React.MutableRefObject<string | null>;
  onAudioUploaded?: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}
