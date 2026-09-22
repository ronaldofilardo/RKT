import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";

export interface EditScoreModalState {
  p1Input: string;
  p2Input: string;
  tiebreakP1: string;
  tiebreakP2: string;
  p1Points: string;
  p2Points: string;
  nextServer: "player1" | "player2";
  newSets: SetEditData[];
  editableCompletedSets: SetEditData[];
}

export interface UseEditScoreModalOptions {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  completedSets: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
}

export interface UseEditScoreModalReturn {
  state: EditScoreModalState;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  confirmError: string | null;
  floorValidationError: string | null;
  isConfirming: boolean;
  calculations: any;
  handleGameInputChange: (value: string, setter: (v: string) => void, player: 'p1' | 'p2', otherInput?: string) => void;
  handleTiebreakInputChange: (value: string, player: 'p1' | 'p2') => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  handleAddSet: () => void;
  handleConfirmSet: () => void;
  canConfirmSet: boolean;
  handlePointsChange: (p1: string, p2: string) => void;
  handleEditCompletedSet: (index: number, p1Games: number, p2Games: number) => void;
  resetState: () => void;
}
