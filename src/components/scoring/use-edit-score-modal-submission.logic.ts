import { getFreshFloorError } from "./use-edit-score-modal-confirm.logic";
import { validateConfirmForm, buildExistingSetsPayload } from "./use-edit-score-modal-validation.logic";
import { prepareFullSetSubmission } from "./use-edit-score-modal-submission-prepare.logic";
import { applyFullSetSubmission } from "./use-edit-score-modal-submission-apply.logic";
import type { ConfirmFlowParams } from "./use-edit-score-modal-submission.types";

export async function executeConfirmFlow(params: ConfirmFlowParams) {
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

  const formError = validateConfirmForm(params);

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
