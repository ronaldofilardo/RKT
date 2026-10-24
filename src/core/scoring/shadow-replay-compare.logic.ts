import { ScoringState } from './types';

export interface ScoreComparisonResult {
  matches: boolean;
  divergences: string[];
  expectedDivergenceReason?: 'SCORE_EDIT_SEGMENT' | 'LEGACY_TRUNCATED_HISTORY' | 'UNVOIDED_LEGACY_UNDO';
}

export function compareScoringStates(
  canonical: ScoringState,
  simulated: ScoringState,
  hasScoreEdits = false,
): ScoreComparisonResult {
  const divergences: string[] = [];

  if (canonical.isFinished !== simulated.isFinished) {
    divergences.push(`isFinished mismatch: canonical=${canonical.isFinished}, simulated=${simulated.isFinished}`);
  }

  if (canonical.winner !== simulated.winner) {
    divergences.push(`winner mismatch: canonical=${canonical.winner}, simulated=${simulated.winner}`);
  }

  if (canonical.setsWon?.player1 !== simulated.setsWon?.player1 || canonical.setsWon?.player2 !== simulated.setsWon?.player2) {
    divergences.push(
      `setsWon mismatch: canonical=(${canonical.setsWon?.player1}/${canonical.setsWon?.player2}), simulated=(${simulated.setsWon?.player1}/${simulated.setsWon?.player2})`,
    );
  }

  const cSets = canonical.sets ?? [];
  const sSets = simulated.sets ?? [];
  if (cSets.length !== sSets.length) {
    divergences.push(`sets length mismatch: canonical=${cSets.length}, simulated=${sSets.length}`);
  } else {
    for (let i = 0; i < cSets.length; i++) {
      const cs = cSets[i];
      const ss = sSets[i];
      if (cs.player1 !== ss.player1 || cs.player2 !== ss.player2) {
        divergences.push(`set ${i + 1} games mismatch: canonical=${cs.player1}-${cs.player2}, simulated=${ss.player1}-${ss.player2}`);
      }
      if (cs.isTiebreak !== ss.isTiebreak) {
        divergences.push(`set ${i + 1} isTiebreak mismatch: canonical=${cs.isTiebreak}, simulated=${ss.isTiebreak}`);
      }
    }
  }

  let expectedReason: ScoreComparisonResult['expectedDivergenceReason'];
  if (divergences.length > 0 && hasScoreEdits) {
    expectedReason = 'SCORE_EDIT_SEGMENT';
  }

  return {
    matches: divergences.length === 0,
    divergences,
    expectedDivergenceReason: expectedReason,
  };
}
