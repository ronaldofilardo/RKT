'use client';

interface EditScoreFormErrorsProps {
  floorValidationError: string | null;
  currentScoreBelowOriginal?: boolean;
}

/** Erros de consistência do placar editado (piso da partida e placar inferior). */
export function EditScoreFormErrors({ floorValidationError, currentScoreBelowOriginal }: EditScoreFormErrorsProps) {
  return (
    <>
      {floorValidationError && (
        <p className="text-xs text-red-400">{floorValidationError}</p>
      )}

      {currentScoreBelowOriginal && (
        <p className="text-xs text-red-400">
          Placar não pode ser inferior ao placar atual da partida
        </p>
      )}
    </>
  );
}

interface EditScoreFormFeedbackProps {
  p1Input: string;
  p2Input: string;
  playerNames: { p1: string; p2: string };
  totalEditedSets: number;
  isMatchTiebreakSet: boolean;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakComplete: boolean;
  validationError?: string;
}

function buildStatusMessage({
  p1Input,
  p2Input,
  playerNames,
  totalEditedSets,
  isMatchTiebreakSet,
  isSetTrulyCompleted,
}: EditScoreFormFeedbackProps): string | null {
  if (!p1Input && !p2Input) return null;

  const winner = parseInt(p1Input, 10) > parseInt(p2Input, 10) ? playerNames.p1 : playerNames.p2;

  if (isMatchTiebreakSet) {
    if (isSetTrulyCompleted) {
      return `${winner} venceu o match tiebreak — partida encerrada`;
    }
    return null;
  }

  if (isSetTrulyCompleted) {
    return `${winner} venceu o set`;
  }

  return `Set ${totalEditedSets + 1} em andamento — informe os games`;
}

/** Avisos de tiebreak/validation e a mensagem de status do set em edição. */
export function EditScoreFormFeedback(props: EditScoreFormFeedbackProps) {
  const { p1Input, p2Input, hasTiebreak, isSetTrulyCompleted, tiebreakComplete, validationError } = props;

  return (
    <>
      {hasTiebreak && p1Input && p2Input && isSetTrulyCompleted && !tiebreakComplete && (
        <p className="text-xs text-amber-400">
          Tiebreak necessário - informe os pontos para completar o set
        </p>
      )}

      {p1Input && p2Input && validationError && (
        <p className="text-xs text-red-400 mt-1">{validationError}</p>
      )}

      {p1Input && p2Input && !validationError && (
        <div
          className={`text-center text-xs py-1 px-2 rounded-md ${
            isSetTrulyCompleted
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-medium'
              : 'text-amber-400 bg-amber-500/10'
          }`}
        >
          {buildStatusMessage(props)}
        </div>
      )}
    </>
  );
}
