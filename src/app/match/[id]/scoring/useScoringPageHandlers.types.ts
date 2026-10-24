import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";

export interface ScoringPageHandlers {
  persistState: ReturnType<typeof useScoringHandlers>["persistState"];
  fetchMatch: ReturnType<typeof useScoringHandlers>["fetchMatch"];
  confirmMatchSetup: ReturnType<typeof useScoringHandlers>["confirmMatchSetup"];
  undoLastPoint: ReturnType<typeof useScoringHandlers>["undoLastPoint"];
  returnToPreviousScreen: ReturnType<typeof useScoringHandlers>["returnToPreviousScreen"];
  openAceModal: ReturnType<typeof useScoringHandlers>["openAceModal"];
  recordAceDirectly: ReturnType<typeof useScoringHandlers>["recordAceDirectly"];
  confirmServerEffect: ReturnType<typeof useScoringHandlers>["confirmServerEffect"];
  confirmServeError: ReturnType<typeof useScoringHandlers>["confirmServeError"];
  recordDirectServeError: ReturnType<typeof useScoringHandlers>["recordDirectServeError"];
  cancelServeError: ReturnType<typeof useScoringHandlers>["cancelServeError"];
  confirmPointDetails: ReturnType<typeof useScoringHandlers>["confirmPointDetails"];
  updateDoublesArrangement?: ReturnType<typeof useScoringHandlers>["updateDoublesArrangement"];
  onPointSelectFromCard: (winnerSide: "player1" | "player2") => void;
  recordServeErrorWithModal: (errorType: "out" | "net", step: "first" | "second") => void;
  cancelEditScore: () => void;
  refreshEditScoreFloor: () => Promise<{ player1: number; player2: number } | null>;
  isProcessing: boolean;
  abandonCurrentSession: ReturnType<typeof useSessionManager>["abandonCurrentSession"];
  openEditScoreModal: (setResults: SetEditData[], server: "player1" | "player2", note?: string) => Promise<import("@/hooks/useSessionManager.edit-score").EditScoreResult>;
  createMatchComment: (content: string, audio?: { blob: Blob; durationMs: number }, category?: string) => Promise<void>;
}
