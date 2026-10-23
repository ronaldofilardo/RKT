import type { ScoringState } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers";

export interface PointSyncConfig {
  matchId: string;
  match: MatchData | null;
  tokenRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setError: (error: string) => void;
}

export interface PointSyncResult {
  success: boolean;
  needsResync?: boolean;
  serverResponse?: ServerResponse;
  needsLogin?: boolean;
}

export interface ServerResponse {
  scoreState?: ScoringState;
  version?: number;
  pointLogId?: string;
}

export interface VersionConflictBody {
  error?: string;
  expectedSequence?: number;
}

export interface ErrorResponseBody {
  error?: string;
  message?: string;
}
