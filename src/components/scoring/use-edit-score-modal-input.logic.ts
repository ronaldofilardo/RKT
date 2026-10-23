import type { TennisFormat } from "@/core/scoring/types";
import { validateSetResult } from '@/core/scoring/edit-score-domain';
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import { calculateNextServer } from "@/core/scoring/edit-score-state";
import { getInitialGames } from "@/core/scoring/format-rules";
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from "@/hooks/use-session-manager.logic";
import { toCompletedSetsForServer } from "./use-edit-score-modal-confirm.logic";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { validateCompletedSetEdit, buildNextSetData } from "./edit-score-modal-set-build.logic";

export { computeGameInputChange, computeTiebreakInputChange } from './edit-score-modal-input-values.logic';
export { validateCompletedSetEdit, buildNextSetData } from './edit-score-modal-set-build.logic';

export function performAddSet(params: {
  canAddNextSet: boolean;
  state: EditScoreModalState;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  isMatchTiebreakSet: boolean;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
}) {
  if (!params.canAddNextSet) return;
  const { setData, tiebreakForServer, p1Games, p2Games } = buildNextSetData({
    p1Input: params.state.p1Input,
    p2Input: params.state.p2Input,
    tiebreakP1: params.state.tiebreakP1,
    tiebreakP2: params.state.tiebreakP2,
    isMatchTiebreakSet: params.isMatchTiebreakSet,
  });

  const nextSetIndex = params.completedSets.length + params.state.newSets.length + 1;
  const mockSetResults = [
    ...params.completedSets.map(cs => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false, tiebreakScore: cs.tiebreakScore ?? undefined })),
    ...params.state.newSets,
    setData,
  ];
  const isNextMT = isMatchTiebreakSetUtil(nextSetIndex, mockSetResults, params.matchFormat);
  const initGames = (params.matchFormat && !isNextMT) ? getInitialGames(params.matchFormat) : 0;
  const resetStr = initGames > 0 ? String(initGames) : "";

  params.setState((prev) => ({
    ...prev,
    newSets: [...prev.newSets, setData],
    p1Input: resetStr,
    p2Input: resetStr,
    tiebreakP1: "",
    tiebreakP2: "",
    p1Points: "0",
    p2Points: "0",
    nextServer: calculateNextServer({
      currentServer: params.currentServer,
      initialServer: params.initialServer,
      p1Games,
      p2Games,
      matchFormat: params.matchFormat,
      tiebreakScore: tiebreakForServer,
      completedSets: toCompletedSetsForServer(params.state, params.completedSets, params.matchFormat),
    }),
  }));
}

export function performConfirmSet(
  canConfirmSetCalc: boolean,
  isMatchTiebreakSet: boolean,
  confirmCurrentAction: () => Promise<void>,
  addSetToMatch: () => void,
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>
) {
  if (!canConfirmSetCalc) return;
  if (isMatchTiebreakSet) {
    confirmCurrentAction();
    return;
  }
  addSetToMatch();
  inputTouchedRef.current = { p1: false, p2: false };
}

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
