import type { TennisFormat } from "@/core/scoring/types";
import { validateSetResult } from '@/core/scoring/edit-score-domain';
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { validateCompletedSetEdit } from "./edit-score-modal-set-build.logic";

export { computeGameInputChange, computeTiebreakInputChange } from './edit-score-modal-input-values.logic';
export { validateCompletedSetEdit, buildNextSetData } from './edit-score-modal-set-build.logic';
export { performAddSet, performConfirmSet } from './edit-score-modal-set-actions.logic';

export function applyCompletedSetEdit(params: {
  index: number;
  p1Games: number;
  p2Games: number;
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  floorCurrentSets: { player1: number; player2: number } | null | undefined;
  editedCompletedSetIndicesRef: React.MutableRefObject<Set<number>>;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError: (err: string | null) => void;
  setFloorValidationError: (err: string | null) => void;
}) {
  const error = validateCompletedSetEdit({
    p1Games: params.p1Games,
    p2Games: params.p2Games,
    matchFormat: params.matchFormat,
    originalSet: params.completedSets[params.index],
    floorCurrentSets: params.floorCurrentSets,
  });
  if (error) {
    params.setConfirmError(error);
    return;
  }

  const validation = validateSetResult({ p1Games: params.p1Games, p2Games: params.p2Games }, params.matchFormat);
  params.editedCompletedSetIndicesRef.current.add(params.index);
  params.setState((prev) => {
    const newEditable = [...prev.editableCompletedSets];
    if (newEditable[params.index]) {
      newEditable[params.index] = {
        ...newEditable[params.index],
        p1Games: params.p1Games,
        p2Games: params.p2Games,
        tiebreakScore: validation.hasTiebreak ? newEditable[params.index].tiebreakScore : undefined,
      };
    }
    return { ...prev, editableCompletedSets: newEditable };
  });
  params.setConfirmError(null);
  params.setFloorValidationError(null);
}
