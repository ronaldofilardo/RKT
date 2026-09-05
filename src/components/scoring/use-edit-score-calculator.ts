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
  canConfirmSet: boolean;
  canConfirm: boolean;
  partial: boolean;
  showGamePointsAtZero: boolean;
  isPotentialMTSet: boolean;
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
      tiebreakP1: tiebreakP1,
      tiebreakP2: tiebreakP2,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, completedSets, tiebreakP1, tiebreakP2]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak || !!validation.setValidation?.tiebreakRequired),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak, validation.setValidation],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
    totalEditedSets: state.newSets.length + completedSets.length,
  }), [matchFormat, completedSets, state.newSets, validation]);

  const { p1Val, p2Val } = validation;

  const canAddNextSet = useMemo(() => {
    if (!validation.isSetTrulyCompleted) return false;
    if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
    if (matchState.matchAlreadyOver) return false;
    if (matchState.matchWouldEnd) return false;
    // Only block next set for active MT (not potential MT that hasn't reached 6-6)
    if (matchState.isMatchTiebreakSet) return false;
    if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
    return true;
  }, [validation, matchState, tiebreakValidation]);

  // canConfirmSet: enables the "Confirmar Set" button. Unlike canAddNextSet,
  // this also allows confirming MT sets (where no next set follows).
  const canConfirmSet = useMemo(() => {
    const bothFilled = validation.bothFilled;
    const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
    const hasTiebreak = validation.hasTiebreak;
    const isSetTrulyCompleted = validation.isSetTrulyCompleted;
    const setValidationError = validation.setValidationError;
    const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

    if (!bothFilled) return false;

    if (isMatchTiebreakSet) {
      // Active MT: allow confirm if no validation error, OR if the set is truly completed
      return !setValidationError || isSetTrulyCompleted;
    }

    // Potential MT set that hasn't reached 6-6: treat as regular set
    if (!isSetTrulyCompleted) return false;

    // Regular set (or potential MT not yet at 6-6): need tiebreak if required
    if (hasTiebreak && tiebreakRequired && !tiebreakValidation.hasValidTiebreak) return false;

    return true;
  }, [validation, tiebreakValidation, matchState]);

  const canConfirm = useMemo(() => {
    const bothFilled = validation.bothFilled;
    const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
    const hasTiebreak = validation.hasTiebreak;
    const isSetTrulyCompleted = validation.isSetTrulyCompleted;
    const setValidationError = validation.setValidationError;
    const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

    const hasSetsInProgress = bothFilled;
    if (!hasSetsInProgress && (state.newSets.length > 0 || completedSets.length > 0)) {
      return true;
    }

    if (!bothFilled) return false;

    if (isMatchTiebreakSet) {
      return !setValidationError || isSetTrulyCompleted;
    }

    // Bug (2026-09-02): quando o placar de games é realmente inválido
    // (ex.: 7x0 num set com tiebreak, onde o vencedor deveria ter fechado
    // em 6x0), validateStandardSet retorna um erro SEM o campo `hasTiebreak`
    // definido — e o `?? false` abaixo fazia `!hasTiebreak` virar `true`,
    // liberando o Confirmar mesmo com placar inválido. Precisamos bloquear
    // aqui quando há um erro genuíno (não o "Tiebreak required" pendente,
    // que é tratado normalmente logo abaixo via hasValidTiebreak).
    if (setValidationError && !tiebreakRequired) return false;

    if (!hasTiebreak) return true;

    if (!tiebreakRequired) return true;
    // When tiebreak is required (e.g. 6x6), the tiebreak must be actually
    // complete (>=7 with 2-point margin), not just have valid number inputs.
    // Using hasValidTiebreak here allowed confirming 6x6 with empty tiebreak
    // fields (0x0) — Bug #9.
    return tiebreakValidation.tiebreakComplete;
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
    canConfirmSet,
    canConfirm,
    partial,
    showGamePointsAtZero,
    isPotentialMTSet: matchState.isPotentialMTSet,
  };
}