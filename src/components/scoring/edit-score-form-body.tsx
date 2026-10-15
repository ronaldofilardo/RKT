'use client';

import type { RefObject } from 'react';
import type { SetInputFormProps } from './edit-score-form';
import { EditScoreFormHeader } from './edit-score-form-header';
import { EditScoreFormTrail } from './edit-score-form-trail';
import { EditScoreTiebreakInputs } from './edit-score-tiebreak-inputs';
import { EditScoreGamesGrid } from './edit-score-games-grid';
import { EditScoreFormErrors } from './edit-score-form-feedback';

interface EditScoreFormBodyProps {
  props: SetInputFormProps;
  isMatchOver: boolean;
  p1InputRef: RefObject<HTMLInputElement>;
}

/** Corpo do formulário: rótulo, grade de games, erros e inputs de tiebreak. */
export function EditScoreFormBody({ props, isMatchOver, p1InputRef }: EditScoreFormBodyProps) {
  const {
    matchFormat,
    totalEditedSets,
    currentServer,
    playerNames,
    p1Input,
    p2Input,
    floorCurrentSets,
    floorTiebreak,
    floorValidationError,
    isMatchTiebreakSet,
    isPotentialMTSet,
    hasTiebreak,
    tiebreakP1,
    tiebreakP2,
    tiebreakComplete,
    tiebreakImpossible,
    p1Val,
    p2Val,
    onP1InputChange,
    onP2InputChange,
    onTiebreakInputChange,
    currentScoreBelowOriginal,
  } = props;

  const tbAt = matchFormat === 'PRO_SET_8' ? 9 : 6;
  const isTiebreakInputVisible =
    !isMatchTiebreakSet &&
    hasTiebreak &&
    p1Input &&
    p2Input &&
    ((p1Val === tbAt && p2Val === tbAt) ||
      (p1Val === tbAt + 1 && p2Val === tbAt) ||
      (p1Val === tbAt && p2Val === tbAt + 1));

  return (
    <div className="space-y-4 rounded-lg bg-telemetry-card border border-white/10 p-4">
      <EditScoreFormHeader
        totalEditedSets={totalEditedSets}
        isMatchTiebreakSet={isMatchTiebreakSet}
        isPotentialMTSet={isPotentialMTSet}
      />

      <EditScoreGamesGrid
        matchFormat={matchFormat}
        currentServer={currentServer}
        playerNames={playerNames}
        p1Input={p1Input}
        p2Input={p2Input}
        p1Val={p1Val}
        p2Val={p2Val}
        floorCurrentSets={floorCurrentSets}
        isMatchTiebreakSet={isMatchTiebreakSet}
        p1InputRef={p1InputRef}
        onP1InputChange={onP1InputChange}
        onP2InputChange={onP2InputChange}
      />

      <EditScoreFormErrors
        floorValidationError={floorValidationError}
        currentScoreBelowOriginal={currentScoreBelowOriginal}
      />

      {isTiebreakInputVisible && (
        <EditScoreTiebreakInputs
          playerNames={playerNames}
          currentServer={currentServer}
          tiebreakP1={tiebreakP1}
          tiebreakP2={tiebreakP2}
          tiebreakComplete={tiebreakComplete}
          tiebreakImpossible={tiebreakImpossible}
          floorTiebreak={floorTiebreak}
          onTiebreakInputChange={onTiebreakInputChange}
        />
      )}

      <EditScoreFormTrail props={props} isMatchOver={isMatchOver} />
    </div>
  );
}
