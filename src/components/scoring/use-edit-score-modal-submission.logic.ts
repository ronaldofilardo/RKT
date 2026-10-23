import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreValidation } from "@/core/scoring/edit-score-state.types";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { getEffectiveSetWinner } from "@/core/scoring/edit-score-state";
import { getFreshFloorError } from "./use-edit-score-modal-confirm.logic";
import { validateConfirmForm, buildExistingSetsPayload } from "./use-edit-score-modal-validation.logic";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { prepareFullSetSubmission } from "./use-edit-score-modal-submission-prepare.logic";

async function applyFullSetSubmission(params: {
  submission: ReturnType<typeof prepareFullSetSubmission>;
  validation: EditScoreValidation;
  matchWouldEnd: boolean;
  isSetTrulyCompleted: boolean;
  p1Val: number;
  p2Val: number;
  onConfirm: (sets: SetEditData[], server: "player1" | "player2", note?: string) => void | Promise<void>;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  state?: EditScoreModalState;
}) {
  const { submission, validation, matchWouldEnd, isSetTrulyCompleted, p1Val, p2Val, onConfirm, onMatchFinished, setState, inputTouchedRef, state } = params;
  await onConfirm(submission.allSets, submission.nextServer, state?.note);

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

export async function executeConfirmFlow(params: {
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
  onConfirm: (sets: SetEditData[], server: "player1" | "player2", note?: string) => void | Promise<void>;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError: (err: string | null) => void;
  setIsConfirming: (val: boolean) => void;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
}) {
  params.setConfirmError(null);

  const existingPayload = buildExistingSetsPayload({
    state: params.state,
    completedSets: params.completedSets,
    matchFormat: params.matchFormat,
    currentServer: params.currentServer,
    initialServer: params.initialServer,
    bothFilled: params.bothFilled,
    p1Val: params.p1Val,
    p2Val: params.p2Val,
  });

  if (existingPayload.shouldSave) {
    params.setIsConfirming(true);
    try {
      await params.onConfirm(existingPayload.existingSets, existingPayload.recalculatedServer, params.state.note);
    } finally {
      params.setIsConfirming(false);
    }
    return;
  }

  if (params.tiebreakImpossible) {
    params.setConfirmError("Placar de tiebreak impossível — ajuste para um valor válido");
    return;
  }

  if (params.onRefreshFloor && params.floorCurrentSets && !params.isSetTrulyCompleted) {
    const freshError = await getFreshFloorError(
      params.onRefreshFloor,
      params.floorCurrentSets,
      params.isSetTrulyCompleted,
      params.p1Val,
      params.p2Val,
    );
    if (freshError) {
      params.setConfirmError(freshError);
      return;
    }
  }

  const formError = validateConfirmForm({
    bothFilled: params.bothFilled,
    floorValidationError: params.floorValidationError,
    setValidationError: params.validation.setValidationError,
    partial: params.partial,
    hasTiebreak: params.hasTiebreak,
    isSetTrulyCompleted: params.isSetTrulyCompleted,
    tiebreakComplete: params.tiebreakComplete,
    p1Val: params.p1Val,
    p2Val: params.p2Val,
    tiebreakP1Num: params.tiebreakP1Num,
    tiebreakP2Num: params.tiebreakP2Num,
    floorCurrentSets: params.floorCurrentSets,
    floorTiebreak: params.floorTiebreak,
    initialGame: params.initialGame,
    isMatchTiebreakSet: params.isMatchTiebreakSet,
    currentSets: params.currentSets,
    state: params.state,
  });

  if (formError) {
    params.setConfirmError(formError);
    return;
  }

  const submission = prepareFullSetSubmission({
    p1Val: params.p1Val,
    p2Val: params.p2Val,
    isSetTrulyCompleted: params.isSetTrulyCompleted,
    hasTiebreak: params.hasTiebreak,
    tiebreakP1Num: params.tiebreakP1Num,
    tiebreakP2Num: params.tiebreakP2Num,
    isMatchTiebreakSet: params.isMatchTiebreakSet,
    isPotentialMTSet: params.isPotentialMTSet,
    state: params.state,
    currentSets: params.currentSets,
    matchFormat: params.matchFormat,
    completedSets: params.completedSets,
    currentServer: params.currentServer,
    initialServer: params.initialServer,
    tiebreakComplete: params.tiebreakComplete,
  });

  params.setIsConfirming(true);
  try {
    await applyFullSetSubmission({
      submission,
      validation: params.validation,
      matchWouldEnd: params.matchWouldEnd,
      isSetTrulyCompleted: params.isSetTrulyCompleted,
      p1Val: params.p1Val,
      p2Val: params.p2Val,
      onConfirm: params.onConfirm,
      onMatchFinished: params.onMatchFinished,
      setState: params.setState,
      inputTouchedRef: params.inputTouchedRef,
      state: params.state,
    });
  } finally {
    params.setIsConfirming(false);
  }
}
