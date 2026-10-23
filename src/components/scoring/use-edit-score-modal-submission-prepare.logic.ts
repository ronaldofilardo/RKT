import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { createSetEditData } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { buildConfirmSubmission } from "./use-edit-score-modal-confirm-build.logic";

/**
 * Prepara a submissão de um set completo: cria o `SetEditData` e resolve
 * o conjunto final de sets + próximo sacador.
 */
export function prepareFullSetSubmission(params: {
  p1Val: number;
  p2Val: number;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  state: EditScoreModalState;
  currentSets: { player1: number; player2: number };
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  tiebreakComplete?: boolean;
}): { setData: SetEditData; allSets: SetEditData[]; nextServer: "player1" | "player2" } {
  const {
    p1Val,
    p2Val,
    isSetTrulyCompleted,
    hasTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    isMatchTiebreakSet,
    isPotentialMTSet,
    state,
    currentSets,
    matchFormat,
    completedSets,
    currentServer,
    initialServer,
    tiebreakComplete,
  } = params;

  const setData = createSetEditData({
    p1Val,
    p2Val,
    isSetTrulyCompleted,
    hasTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    isMatchTiebreakSet,
    isPotentialMTSet,
    p1Points: state.p1Points,
    p2Points: state.p2Points,
    currentSets,
    matchFormat,
  });

  const { allSets, nextServer } = buildConfirmSubmission({
    state,
    completedSets,
    matchFormat,
    currentServer,
    initialServer,
    setData,
    p1Val,
    p2Val,
    tiebreakComplete,
    tiebreakP1Num,
    tiebreakP2Num,
  });

  return { setData, allSets, nextServer };
}
