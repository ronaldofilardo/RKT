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
  editableCompletedSets?: Array<{
    p1Games: number;
    p2Games: number;
    isPartial: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
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
    tiebreakImpossible: boolean;
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
  editableCompletedSets,
  state,
  tiebreakP1,
  tiebreakP2,
}: UseEditScoreCalculatorParams): EditScoreCalculations {
  // FIX #8: Usar editableCompletedSets (array editado pelo usuário) em vez
  // do prop completedSets para calcular totalEditedSets. Quando o usuário
  // remove ou edita sets completados, o prop original não muda — mas o
  // editableCompletedSets reflete as remoções/edições do usuário.
  const effectiveCompletedCount = editableCompletedSets?.length ?? completedSets.length;

  const validation = useMemo(() => {
    const setResults: SetEditData[] = [
      ...completedSets.map(cs => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false })),
      ...state.newSets,
    ];
    return calculateValidation({
      p1Input: state.p1Input,
      p2Input: state.p2Input,
      matchFormat,
      totalEditedSets: state.newSets.length + effectiveCompletedCount,
      setResults,
      tiebreakP1: tiebreakP1,
      tiebreakP2: tiebreakP2,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, effectiveCompletedCount, completedSets, tiebreakP1, tiebreakP2]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak || !!validation.setValidation?.tiebreakRequired),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak, validation.setValidation],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
    totalEditedSets: state.newSets.length + effectiveCompletedCount,
  }), [matchFormat, completedSets, state.newSets, validation, effectiveCompletedCount]);

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
    const tiebreakImpossible = tiebreakValidation.tiebreakImpossible;

    if (!bothFilled) return false;
    if (tiebreakImpossible) return false;

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
    const setValidationError = validation.setValidationError;
    const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;
    const tiebreakImpossible = tiebreakValidation.tiebreakImpossible;

    // Se já existem newSets pendentes e não há input atual, permitir confirmar (envia newSets existentes)
    if (!bothFilled && state.newSets.length > 0) {
      return true;
    }

    // Sem placar novo (inputs vazios ou pre-fill 0x0) mas com sets já
    // completados/editados: permite confirmar para persistir as edições dos
    // sets existentes — o propósito do modal é editar o placar, e exigir um
    // novo set para poder salvar bloqueava essa edição.
    const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
    if ((!bothFilled || scoresAreZero) && (completedSets.length > 0 || state.newSets.length > 0)) {
      return true;
    }

    // Precisa de ambos os inputs preenchidos
    if (!bothFilled) return false;

    // Bloquear tiebreak impossível (ex.: 7x10, 13x8)
    if (tiebreakImpossible) return false;

    // Para match tiebreak, lógica existente
    if (isMatchTiebreakSet) {
      return !setValidationError || validation.isSetTrulyCompleted;
    }

    // Bloquear para erros genuínos (não "Tiebreak required")
    if (setValidationError && !tiebreakRequired) return false;

    // Para sets com tiebreak obrigatório (6x6): precisa de tiebreak completo
    // para auto-avanço, mas permite confirmar parcial se tiebreak não completo
    if (tiebreakRequired) {
      // Permite confirmar mesmo com tiebreak incompleto (salva 6x6 como parcial)
      return true;
    }

    return true;
  }, [validation, matchState, state.newSets.length, completedSets.length, tiebreakValidation]);

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