'use client';

import { SetInputForm } from './edit-score-form';
import type { EditScoreModalContentProps } from './edit-score-modal.types';

type SetInputSectionProps = Pick<
  EditScoreModalContentProps,
  | 'matchFormat'
  | 'playerNames'
  | 'currentServer'
  | 'floorCurrentSets'
  | 'effectiveFloorTiebreak'
  | 'floorValidationError'
  | 'state'
  | 'setState'
  | 'calculations'
  | 'canConfirmSet'
  | 'handlers'
>;

/** Formulário do novo set com bindings de estado derivados das calculations. */
export function EditScoreSetInputSection({
  matchFormat,
  playerNames,
  currentServer,
  floorCurrentSets,
  effectiveFloorTiebreak,
  floorValidationError,
  state,
  setState,
  calculations,
  canConfirmSet,
  handlers,
}: SetInputSectionProps) {
  const { validation, tiebreakValidation, matchState, partial } = calculations;
  const { p1Val, p2Val, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd, totalEditedSets, p1SetsWon, p2SetsWon } = matchState;

  return (
    <SetInputForm
      matchFormat={matchFormat}
      totalEditedSets={totalEditedSets}
      currentServer={currentServer}
      playerNames={playerNames}
      p1Input={state.p1Input}
      p2Input={state.p2Input}
      p1Points={state.p1Points}
      p2Points={state.p2Points}
      tiebreakP1={state.tiebreakP1}
      tiebreakP2={state.tiebreakP2}
      floorCurrentSets={floorCurrentSets}
      floorTiebreak={effectiveFloorTiebreak}
      floorValidationError={floorValidationError}
      isMatchTiebreakSet={isMatchTiebreakSet}
      isPotentialMTSet={calculations.isPotentialMTSet}
      hasTiebreak={hasTiebreak}
      isSetTrulyCompleted={isSetTrulyCompleted}
      tiebreakComplete={tiebreakValidation.tiebreakComplete}
      tiebreakImpossible={tiebreakValidation.tiebreakImpossible}
      partial={!!partial}
      p1Val={p1Val}
      p2Val={p2Val}
      validationError={validation.setValidationError}
      matchAlreadyOver={matchState.matchAlreadyOver}
      matchWouldEnd={matchWouldEnd}
      p1SetsWon={p1SetsWon}
      p2SetsWon={p2SetsWon}
      maxSets={matchState.maxSets}
      showGamePointsAtZero={calculations.showGamePointsAtZero}
      canConfirmSet={canConfirmSet}
      onConfirmSet={handlers.commitSetScore}
      onP1InputChange={(v: string) =>
        handlers.updateGameInputValue(v, (val: string) => setState(prev => ({ ...prev, p1Input: val })), 'p1', state.p2Input)}
      onP2InputChange={(v: string) =>
        handlers.updateGameInputValue(v, (val: string) => setState(prev => ({ ...prev, p2Input: val })), 'p2', state.p1Input)}
      onP1PointsChange={(v: string) => handlers.updatePointTotals(v, state.p2Points)}
      onP2PointsChange={(v: string) => handlers.updatePointTotals(state.p1Points, v)}
      onTiebreakInputChange={handlers.updateTiebreakInputValue}
      currentScoreBelowOriginal={calculations.currentScoreBelowOriginal}
    />
  );
}
