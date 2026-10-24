import type { EditScoreValidation } from "@/core/scoring/edit-score-state.types";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { getEffectiveSetWinner } from "@/core/scoring/edit-score-state";
import type { EditScoreResult } from "@/hooks/useSessionManager.edit-score";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import type { prepareFullSetSubmission } from "./use-edit-score-modal-submission-prepare.logic";
import { getEditScoreErrorMessage } from "./edit-score-error-messages";

/**
 * Confirma a submissão do set, finaliza o match quando aplicável e limpa os
 * inputs do modal adicionando o set em `newSets`.
 */
export async function applyFullSetSubmission(params: {
  submission: ReturnType<typeof prepareFullSetSubmission>;
  validation: EditScoreValidation;
  matchWouldEnd: boolean;
  isSetTrulyCompleted: boolean;
  p1Val: number;
  p2Val: number;
  onConfirm: (sets: SetEditData[], server: "player1" | "player2", note?: string) => void | Promise<void | EditScoreResult> | EditScoreResult;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError?: (err: string | null) => void;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  state?: EditScoreModalState;
}) {
  const { submission, validation, matchWouldEnd, isSetTrulyCompleted, p1Val, p2Val, onConfirm, onMatchFinished, setState, setConfirmError, inputTouchedRef, state } = params;
  const res = await onConfirm(submission.allSets, submission.nextServer, state?.note);

  if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
    if (setConfirmError) {
      setConfirmError(getEditScoreErrorMessage(res.reason));
    }
    return;
  }

  if (matchWouldEnd && isSetTrulyCompleted && onMatchFinished) {
    const winner = getEffectiveSetWinner(validation) ?? (p1Val > p2Val ? "player1" : "player2");
    await onMatchFinished(winner);
  }

  setState((prev: EditScoreModalState) => ({
    ...prev,
    newSets: [...prev.newSets, submission.setData],
    p1Input: "",
    p2Input: "",
    tiebreakP1: "",
    tiebreakP2: "",
    p1Points: "0",
    p2Points: "0",
    nextServer: submission.nextServer || prev.nextServer,
  }));
  inputTouchedRef.current = { p1: false, p2: false };
}
