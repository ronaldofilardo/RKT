import type { ScoringState } from "@/core/scoring/types";
import type { ToastType } from "@/components/Toast";
import type { PendingAbandon } from "./useSessionManager.pending-abandon";

export interface AbandonContext {
  sessionId: string;
  matchId: string;
  engine: { getState(): Readonly<ScoringState>; serialize(): string };
  token: string | null;
  matchVersion?: number;
}

export interface AbandonDeps {
  enqueuePendingAbandon: (entry: PendingAbandon) => void;
  toast: (args: { type: ToastType; message: string }) => void;
}
