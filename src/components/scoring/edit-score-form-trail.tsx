'use client';

import type { SetInputFormProps } from './edit-score-form';
import { EditScoreFormFeedback } from './edit-score-form-feedback';
import { EditScoreFormActions } from './edit-score-form-actions';
import { EditScoreGamePoints } from './edit-score-game-points';

interface EditScoreFormTrailProps {
  props: SetInputFormProps;
  isMatchOver: boolean;
}

/** Fim do formulário: mensagens de status, ações de confirmação e game points. */
export function EditScoreFormTrail({ props, isMatchOver }: EditScoreFormTrailProps) {
  const {
    p1Input,
    p2Input,
    playerNames,
    totalEditedSets,
    isMatchTiebreakSet,
    isSetTrulyCompleted,
    hasTiebreak,
    tiebreakComplete,
    validationError,
    matchWouldEnd,
    canConfirmSet,
    onConfirmSet,
    p1Val,
    p2Val,
    p1SetsWon,
    p2SetsWon,
    partial,
    floorCurrentSets,
    showGamePointsAtZero,
    currentServer,
    p1Points,
    p2Points,
    onP1PointsChange,
    onP2PointsChange,
  } = props;

  return (
    <>
      <EditScoreFormFeedback
        p1Input={p1Input}
        p2Input={p2Input}
        playerNames={playerNames}
        totalEditedSets={totalEditedSets}
        isMatchTiebreakSet={isMatchTiebreakSet}
        isSetTrulyCompleted={isSetTrulyCompleted}
        hasTiebreak={hasTiebreak}
        tiebreakComplete={tiebreakComplete}
        validationError={validationError}
      />

      <EditScoreFormActions
        isSetTrulyCompleted={isSetTrulyCompleted}
        matchWouldEnd={matchWouldEnd}
        isMatchOver={isMatchOver}
        canConfirmSet={canConfirmSet}
        totalEditedSets={totalEditedSets}
        onConfirmSet={onConfirmSet}
        p1Val={p1Val}
        p2Val={p2Val}
        playerNames={playerNames}
        p1SetsWon={p1SetsWon}
        p2SetsWon={p2SetsWon}
        partial={partial}
        floorCurrentSets={floorCurrentSets}
      >
        {(partial || showGamePointsAtZero) && !isMatchTiebreakSet && !hasTiebreak && (
          <EditScoreGamePoints
            playerNames={playerNames}
            currentServer={currentServer}
            p1Points={p1Points}
            p2Points={p2Points}
            onP1PointsChange={onP1PointsChange}
            onP2PointsChange={onP2PointsChange}
          />
        )}
      </EditScoreFormActions>
    </>
  );
}
