import type { TennisFormat } from '@/core/scoring/types';
import { getNextServerAfterSet } from '@/core/scoring/edit-score-domain';

export type * from '@/core/scoring/edit-score-state.types';
import type {
  Player,
  EditScoreState,
  CalculateNextServerInput,
} from '@/core/scoring/edit-score-state.types';

export {
  isPotentialMTSet,
  calculateTiebreakValidation,
  calculateValidation,
} from '@/core/scoring/edit-score-validation';

import { getInitialGames } from '@/core/scoring/format-rules';

export function createInitialEditScoreState(currentServer: Player, format?: TennisFormat, isMatchTiebreakSet?: boolean): EditScoreState {
  const init = (format && !isMatchTiebreakSet) ? getInitialGames(format) : 0;
  return {
    p1Input: init > 0 ? String(init) : '',
    p2Input: init > 0 ? String(init) : '',
    p1Points: '0',
    p2Points: '0',
    nextServer: currentServer,
    tiebreakP1: '',
    tiebreakP2: '',
    newSets: [],
    note: '',
  };
}

export { getEffectiveSetWinner, computeSetsWon } from '@/core/scoring/edit-score-sets-won.logic';
export { calculateMatchState } from '@/core/scoring/edit-score-match-state.logic';

export { createSetEditData, shouldAutoAddSet } from '@/core/scoring/edit-score-set-data.logic';

export function calculateNextServer(input: CalculateNextServerInput): Player {
  const { currentServer, initialServer, p1Games, p2Games, matchFormat, tiebreakScore, completedSets } = input;
  const completedSetsGames = completedSets.map((cs) => ({
    player1: cs.games.player1,
    player2: cs.games.player2,
  }));
  return getNextServerAfterSet({
    currentServer,
    initialServer,
    p1Games,
    p2Games,
    format: matchFormat,
    tiebreakPoints: tiebreakScore ?? null,
    completedSets: completedSetsGames,
  });
}
