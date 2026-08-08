import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { EditScoreState, EditScoreValidation, EditScoreMatchState, CompletedSet } from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from './edit-score-logic';

export interface UseEditScoreCalculatorParams {
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  currentServer: 'player1' | 'player2';
  state: EditScoreState;
  tiebreakP1: string;
  tiebreakP2: string;
}

export interface EditScoreCalculations {
  validation: EditScoreValidation;
  tiebreakValidation: {
    hasValidTiebreak: boolean;
    tiebreakComplete: boolean;
    tiebreakP1Num: number;
    tiebreakP2Num: number;
  };
  matchState: EditScoreMatchState;
  canAddNextSet: boolean;
  canConfirm: boolean;
  partial: boolean;
  showGamePointsAtZero: boolean;
}

export function useEditScoreCalculator({
  matchFormat,
  completedSets,
  state,
  tiebreakP1,
  tiebreakP2,
}: UseEditScoreCalculatorParams): EditScoreCalculations {
  const validation = useMemo(() => {
    const setResults: SetEditData[] = [
      ...completedSets.map(cs => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false })),
      ...state.newSets,
    ];
    return calculateValidation({
      p1Input: state.p1Input,
      p2Input: state.p2Input,
      matchFormat,
      totalEditedSets: state.newSets.length + completedSets.length,
      setResults,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, completedSets]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
  }), [matchFormat, completedSets, state.newSets, validation]);

  const { p1Val, p2Val } = validation;

  const canAddNextSet = useMemo(() => {
    if (!validation.isSetTrulyCompleted) return false;
    if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
    if (matchState.matchAlreadyOver) return false;
    if (matchState.matchWouldEnd) return false;
    if (matchState.isMatchTiebreakSet) return false;
    if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
    return true;
  }, [validation, matchState, tiebreakValidation]);

  const canConfirm = useMemo(() => {
    const bothFilled = validation.bothFilled;
    const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
    const hasTiebreak = validation.hasTiebreak;
    const tiebreakComplete = tiebreakValidation.tiebreakComplete;
    const isSetTrulyCompleted = validation.isSetTrulyCompleted;
    const setValidationError = validation.setValidationError;
    const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

    // Bug #7/#8 (2026-08-07): the early-return "if there are completed/new
    // sets, button is enabled" used to fire even when the user had a set
    // in progress in an invalid state (e.g. MT 6x5 with stale corrupted
    // completedSets from bug #4). Restrict the shortcut to the case where
    // the user is NOT currently editing a set (both inputs blank) — that
    // means they intend to confirm just the previously completed sets.
    const hasSetsInProgress = bothFilled;
    if (!hasSetsInProgress && (state.newSets.length > 0 || completedSets.length > 0)) {
      return true;
    }

    if (!bothFilled) return false;

    if (isMatchTiebreakSet) {
      // In MT mode, allow confirm if no validation error, OR if the set is
      // truly completed (winner declared). Block otherwise (partial but
      // invalid, e.g. 6x5 valid isPartial — allowed because setValidationError
      // is undefined for valid partials).
      return !setValidationError || isSetTrulyCompleted;
    }

    if (!hasTiebreak) return true;

    // For regular tiebreak sets: allow confirm if tiebreak not required yet
    // (partial score like 6-5) or if tiebreak is complete.
    if (!tiebreakRequired) return true;
    return tiebreakComplete;
  }, [validation, tiebreakValidation, matchState, state.newSets.length, completedSets.length]);

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  const showGamePointsAtZero = useMemo(() => {
    // Bug #10 (2026-08-07): assim que o set atual se completa (ainda sem
    // handleAddSet ter pushado para newSets), a seção "Pontos no Game Atual"
    // do próximo set deve aparecer em 0x0. Antes dependia só de
    // completedSets/newSets, que fica vazio no primeiro set recém-fechado.
    // Bug sutil: o auto-add às vezes não dispara (ex.: matchWouldEnd=false
    // mas isMatchTiebreakSet=true), deixando inputs em 6x4. O "próximo game"
    // ainda é 0x0, então must treat o set já fechado como at-zero também.
    const hasPreviousSets = completedSets.length > 0 || state.newSets.length > 0 || validation.isSetTrulyCompleted;
    const isAtZero =
      !validation.bothFilled ||
      (p1Val === 0 && p2Val === 0) ||
      validation.isSetTrulyCompleted;
    const prevSetCompleted = state.newSets.length > 0
      ? state.newSets[state.newSets.length - 1].isPartial === false
      : completedSets.length > 0 || validation.isSetTrulyCompleted;
    return hasPreviousSets && isAtZero && prevSetCompleted;
  }, [validation, p1Val, p2Val, completedSets.length, state.newSets]);

  return {
    validation,
    tiebreakValidation,
    matchState,
    canAddNextSet,
    canConfirm,
    partial,
    showGamePointsAtZero,
  };
}