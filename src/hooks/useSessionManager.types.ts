import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { HistoryEntry, ScoringState } from "@/core/scoring/types";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "@/hooks/useScoringHandlers";

export interface SuspendedSessionState {
  matchStateSnapshot: string | null;
  previousPointsCount: number;
  snapshotStatus: "IN_SYNC" | "SNAPSHOT_AHEAD" | "BANK_AHEAD";
  snapshotPointCount: number;
  bankPointCount: number;
  bankScoreState: ScoringState | null;
}

export interface SessionManagerContext {
  matchId: string;
  match: MatchData | null;
  isLoading: boolean;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string | null>;
  matchIdRef: MutableRefObject<string>;

  suspendedSession: SuspendedSessionState | null;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  persistState: (state: ScoringState, label: string, persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; history?: HistoryEntry[]; note?: string }) => Promise<{ success: boolean; needsResync?: boolean }>;

  setScoreState: Dispatch<ScoreAction>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
  closeAll?: () => void;
  /**
   * Ref para verificar se um ponto está sendo processado.
   * Usado para prevenir que o modal de edição de placar seja confirmado
   * enquanto um POST /point está em andamento (race condition #1).
   */
  isProcessingRef?: MutableRefObject<boolean>;
  /**
   * Remove pontos pendentes da fila offline para a partida.
   * Usado após edit-score para evitar que pontos antigos (que referenciam
   * o estado anterior) sejam aplicados ao estado editado durante o flush.
   */
  clearQueueForMatch?: (matchId: string) => Promise<void>;
}
