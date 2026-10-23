import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";

export interface UseEditScoreModalSyncParams {
  isOpen: boolean;
  currentServer: "player1" | "player2";
  completedSets: CompletedSet[];
  currentSets: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
  isTiebreak?: boolean;
  isMatchTiebreakSet: boolean;
  p1Val: number;
  p2Val: number;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError: (err: string | null) => void;
  setFloorValidationError: (err: string | null) => void;
  setIsConfirming: (val: boolean) => void;
}
