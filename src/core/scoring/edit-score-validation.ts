import {
  isPotentialMTSet,
  isValidTiebreakInput,
  resolveTiebreakStatus,
} from '@/core/scoring/edit-score-validation-tiebreak.logic';
import {
  parseScoreInput,
  resolveIsMatchTiebreakSet,
  determineSetValidation,
  checkIsSetTrulyCompleted,
  buildSetValidationError,
} from '@/core/scoring/edit-score-validation-set.logic';
import type {
  EditScoreValidation,
  EditScoreValidationInput,
} from '@/core/scoring/edit-score-state.types';

export { isPotentialMTSet, calculateTiebreakValidation } from '@/core/scoring/edit-score-validation-tiebreak.logic';

export function calculateValidation(input: EditScoreValidationInput): EditScoreValidation {
  const { p1Input, p2Input, matchFormat, totalEditedSets, setResults, tiebreakP1, tiebreakP2 } = input;
  const { p1Val, p2Val, bothFilled } = parseScoreInput(p1Input, p2Input);

  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResults);
  const isMatchTiebreakSet = resolveIsMatchTiebreakSet(
    potentialMT,
    bothFilled,
    p1Val,
    p2Val,
    setResults,
    totalEditedSets,
    matchFormat,
  );

  const setValidation = determineSetValidation(bothFilled, isMatchTiebreakSet, p1Val, p2Val, matchFormat);

  const tbP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : 0;
  const tbP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : 0;
  const hasValidTiebreak = isValidTiebreakInput(tbP1Num, tbP2Num);

  const { tbLoser, tbWinner, tiebreakImpossible, tiebreakComplete } = resolveTiebreakStatus(
    setValidation,
    hasValidTiebreak,
    tbP1Num,
    tbP2Num,
  );

  let hasContradiction = false;
  if (setValidation?.winner && hasValidTiebreak && tiebreakComplete) {
    const tbWinnerPlayer = tbP1Num > tbP2Num ? 'player1' : 'player2';
    if (setValidation.winner !== tbWinnerPlayer) {
      hasContradiction = true;
    }
  }

  const { completed, hasWinner, isSetTrulyCompleted } = checkIsSetTrulyCompleted(
    setValidation,
    tiebreakComplete,
    hasContradiction,
  );

  const setValidationError = buildSetValidationError(
    tiebreakImpossible,
    isSetTrulyCompleted,
    setValidation,
    tbWinner,
    tbLoser,
    hasContradiction,
  );

  return {
    bothFilled,
    p1Val,
    p2Val,
    setValidation,
    hasWinner,
    completed,
    isSetTrulyCompleted,
    setValidationError,
    hasTiebreak: setValidation?.hasTiebreak ?? false,
    isMatchTiebreakSet,
    isPotentialMTSet: potentialMT && !isMatchTiebreakSet,
    hasValidTiebreak,
    tiebreakComplete,
    tiebreakImpossible,
    tiebreakP1Num: tbP1Num,
    tiebreakP2Num: tbP2Num,
  };
}
