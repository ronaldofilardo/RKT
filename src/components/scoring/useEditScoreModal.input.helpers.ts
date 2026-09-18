import type { TennisFormat } from "@/core/scoring/types";
import { SCORING_LIMITS } from "@/lib/constants";
import { validateSetResult, getMaxValidGames } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";
import type { SetEditData } from "./editScoreHelpers";
import { calculateNextServer } from "./edit-score-logic";
import { toCompletedSetsForServer } from "./useEditScoreModal.confirm.helpers";
import type { EditScoreModalState } from "./useEditScoreModal.types";

function checkBelowMinimumInput(
  num: number,
  player: 'p1' | 'p2',
  currentInputVal: string,
  currentSets: { player1: number; player2: number },
): boolean {
  const currentInput = parseInt(currentInputVal, 10) || 0;
  const minFromCurrent = player === 'p1' ? currentSets.player1 : currentSets.player2;
  return currentInput >= minFromCurrent && num < minFromCurrent;
}

export function computeGameInputChange(params: {
  value: string;
  isMatchTiebreakSet: boolean;
  matchFormat: TennisFormat;
  otherInput?: string;
  currentSets: { player1: number; player2: number };
  player: 'p1' | 'p2';
  currentInputVal: string;
}): { shouldSet: boolean; valueToSet: string; clearTiebreak: boolean } {
  const { value, isMatchTiebreakSet, matchFormat, otherInput, currentSets, player, currentInputVal } = params;
  if (value === "") {
    return { shouldSet: true, valueToSet: "", clearTiebreak: true };
  }
  if (!/^\d+$/.test(value)) {
    return { shouldSet: false, valueToSet: "", clearTiebreak: false };
  }
  const num = parseInt(value, 10);
  if (checkBelowMinimumInput(num, player, currentInputVal, currentSets)) {
    return { shouldSet: false, valueToSet: "", clearTiebreak: false };
  }

  const otherGames = otherInput ? (parseInt(otherInput, 10) || 0) : 0;
  const maxGames = isMatchTiebreakSet
    ? SCORING_LIMITS.TIEBREAK_INPUT_CAP
    : getMaxValidGames(otherGames, matchFormat);

  const valueToSet = num > maxGames ? String(maxGames) : num.toString();
  return { shouldSet: true, valueToSet, clearTiebreak: true };
}

export function computeTiebreakInputChange(params: {
  value: string;
  player: 'p1' | 'p2';
  currentGamePoints?: { player1: number | string; player2: number | string };
  currentTbInputVal: string;
}): { shouldSet: boolean; valueToSet: string } {
  const { value, player, currentGamePoints, currentTbInputVal } = params;
  if (value === '') {
    return { shouldSet: true, valueToSet: '' };
  }
  const v = parseInt(value, 10);
  if (isNaN(v) || v < 0) {
    return { shouldSet: false, valueToSet: '' };
  }
  if (currentGamePoints) {
    const currentTbInput = parseInt(currentTbInputVal, 10) || 0;
    const minFromCurrent = Number(player === 'p1' ? currentGamePoints.player1 : currentGamePoints.player2) || 0;
    if (currentTbInput >= minFromCurrent && v < minFromCurrent) {
      return { shouldSet: false, valueToSet: '' };
    }
  }
  const capped = Math.min(v, SCORING_LIMITS.TIEBREAK_INPUT_CAP);
  return { shouldSet: true, valueToSet: String(capped) };
}

export function validateCompletedSetEdit(params: {
  p1Games: number;
  p2Games: number;
  matchFormat: TennisFormat;
  originalSet?: CompletedSet;
  floorCurrentSets?: { player1: number; player2: number } | null;
}): string | null {
  const { p1Games, p2Games, matchFormat, originalSet, floorCurrentSets } = params;
  const validation = validateSetResult({ p1Games, p2Games }, matchFormat);
  if (validation.error && !validation.isPartial) {
    return validation.error;
  }
  if (originalSet) {
    if (p1Games < originalSet.games.player1 || p2Games < originalSet.games.player2) {
      return "Placar não pode ser inferior ao registrado no momento do abandono";
    }
  }
  if (floorCurrentSets) {
    if (p1Games < floorCurrentSets.player1 || p2Games < floorCurrentSets.player2) {
      return `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}).`;
    }
  }
  return null;
}

export function buildNextSetData(params: {
  p1Input: string;
  p2Input: string;
  tiebreakP1: string;
  tiebreakP2: string;
  isMatchTiebreakSet: boolean;
}): { setData: SetEditData; tiebreakForServer: { player1: number; player2: number } | null; p1Games: number; p2Games: number } {
  const p1Games = parseInt(params.p1Input, 10) || 0;
  const p2Games = parseInt(params.p2Input, 10) || 0;
  const tbP1Num = parseInt(params.tiebreakP1, 10);
  const tbP2Num = parseInt(params.tiebreakP2, 10);
  const hasTiebreakScore = !isNaN(tbP1Num) && !isNaN(tbP2Num) && tbP1Num >= 0 && tbP2Num >= 0;

  const setData: SetEditData = {
    p1Games,
    p2Games,
    isPartial: false,
    ...(hasTiebreakScore ? { tiebreakScore: { player1: tbP1Num, player2: tbP2Num } } : {}),
  };

  const tiebreakForServer = params.isMatchTiebreakSet
    ? { player1: p1Games, player2: p2Games }
    : hasTiebreakScore
      ? { player1: tbP1Num, player2: tbP2Num }
      : null;

  return { setData, tiebreakForServer, p1Games, p2Games };
}

export function performAddSet(params: {
  canAddNextSet: boolean;
  state: EditScoreModalState;
  currentServer: "player1" | "player2";
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

  params.setState((prev) => ({
    ...prev,
    newSets: [...prev.newSets, setData],
    p1Input: "",
    p2Input: "",
    tiebreakP1: "",
    tiebreakP2: "",
    nextServer: calculateNextServer({
      currentServer: params.currentServer,
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
  handleConfirm: () => Promise<void>,
  handleAddSet: () => void,
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>,
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>,
) {
  if (!canConfirmSetCalc) return;
  if (isMatchTiebreakSet) {
    handleConfirm();
    return;
  }
  handleAddSet();
  setState((prev) => ({
    ...prev,
    p1Input: "",
    p2Input: "",
    tiebreakP1: "",
    tiebreakP2: "",
    p1Points: "0",
    p2Points: "0",
  }));
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

  params.editedCompletedSetIndicesRef.current.add(params.index);
  params.setState((prev) => {
    const newEditable = [...prev.editableCompletedSets];
    if (newEditable[params.index]) {
      newEditable[params.index] = { ...newEditable[params.index], p1Games: params.p1Games, p2Games: params.p2Games };
    }
    return { ...prev, editableCompletedSets: newEditable };
  });
  params.setConfirmError(null);
  params.setFloorValidationError(null);
}
