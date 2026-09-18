import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "./edit-score-logic";
import type { SetEditData } from "./editScoreHelpers";
import { calculateNextServer, createSetEditData, getEffectiveSetWinner } from "./edit-score-logic";
import { getCompletedSets, toCompletedSetsForServer, getFreshFloorError } from "./useEditScoreModal.confirm.helpers";
import { validateConfirmForm, buildExistingSetsPayload } from "./useEditScoreModal.validation.helpers";
import type { EditScoreModalState } from "./useEditScoreModal.types";

export function buildConfirmSubmission(params: {
  state: any;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: "player1" | "player2";
  setData: SetEditData;
  p1Val: number;
  p2Val: number;
  tiebreakComplete: boolean | undefined;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
}): { allSets: SetEditData[]; nextServer: "player1" | "player2" } {
  const { state, completedSets, matchFormat, currentServer, setData, p1Val, p2Val, tiebreakComplete, tiebreakP1Num, tiebreakP2Num } = params;
  const allCompletedSetsForServer: CompletedSet[] = [
    ...toCompletedSetsForServer(state, completedSets, matchFormat),
    ...state.newSets.map((ns: any) => ({
      games: { player1: ns.p1Games, player2: ns.p2Games } as Record<'player1' | 'player2', number>,
      winner: (ns.p1Games > ns.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
      tiebreakScore: ns.tiebreakScore,
    })),
  ];

  const nextServer = calculateNextServer({
    currentServer,
    p1Games: p1Val,
    p2Games: p2Val,
    matchFormat,
    tiebreakScore: tiebreakComplete ? { player1: tiebreakP1Num, player2: tiebreakP2Num } : null,
    completedSets: allCompletedSetsForServer,
  }) || currentServer;

  const allNewSetsForConfirm = [...state.newSets, setData];
  const allSets = [...getCompletedSets(state, completedSets, matchFormat), ...allNewSetsForConfirm];

  return { allSets, nextServer };
}

export function prepareFullSetSubmission(params: {
  p1Val: number;
  p2Val: number;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  state: any;
  currentSets: { player1: number; player2: number };
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  currentServer: "player1" | "player2";
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
    setData,
    p1Val,
    p2Val,
    tiebreakComplete,
    tiebreakP1Num,
    tiebreakP2Num,
  });

  return { setData, allSets, nextServer };
}


export async function applyFullSetSubmission(params: {
  submission: ReturnType<typeof prepareFullSetSubmission>;
  validation: any;
  matchWouldEnd: boolean;
  isSetTrulyCompleted: boolean;
  p1Val: number;
  p2Val: number;
  onConfirm: (sets: SetEditData[], server: "player1" | "player2") => void | Promise<void>;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
}) {
  const { submission, validation, matchWouldEnd, isSetTrulyCompleted, p1Val, p2Val, onConfirm, onMatchFinished, setState, inputTouchedRef } = params;
  await onConfirm(submission.allSets, submission.nextServer);

  if (matchWouldEnd && isSetTrulyCompleted && onMatchFinished) {
    const winner = getEffectiveSetWinner(validation) ?? (p1Val > p2Val ? "player1" : "player2");
    await onMatchFinished(winner);
  }

  setState((prev) => ({
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
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  tiebreakImpossible?: boolean;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
  floorCurrentSets?: { player1: number; player2: number } | null;
  isSetTrulyCompleted: boolean;
  validation: any;
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
  onConfirm: (sets: SetEditData[], server: "player1" | "player2") => void | Promise<void>;
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
    bothFilled: params.bothFilled,
    p1Val: params.p1Val,
    p2Val: params.p2Val,
  });

  if (existingPayload.shouldSave) {
    params.setIsConfirming(true);
    try {
      await params.onConfirm(existingPayload.existingSets, existingPayload.recalculatedServer);
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
    });
  } finally {
    params.setIsConfirming(false);
  }
}
