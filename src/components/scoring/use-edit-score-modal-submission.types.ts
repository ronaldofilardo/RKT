import type { EditScoreResult } from "@/hooks/useSessionManager.edit-score";
import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreValidation } from "@/core/scoring/edit-score-state.types";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { EditScoreModalState } from "./useEditScoreModal.types";

/**
 * Parâmetros do fluxo de confirmação de edição de score
 * (`executeConfirmFlow`) — extraídos para manter a fachada enxuta (R-03).
 */
export type ConfirmFlowParams = {
  state: EditScoreModalState;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  tiebreakImpossible?: boolean;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  isSetTrulyCompleted: boolean;
  validation: EditScoreValidation;
  floorValidationError: string | null;
  partial: boolean;
  hasTiebreak: boolean;
  tiebreakComplete?: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  initialGame: { player1: string; player2: string } | null;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  currentSets: { player1: number; player2: number };
  matchWouldEnd: boolean;
  onConfirm: (sets: SetEditData[], server: "player1" | "player2", note?: string) => void | Promise<void | EditScoreResult> | EditScoreResult;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError: (err: string | null) => void;
  setIsConfirming: (val: boolean) => void;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
};
