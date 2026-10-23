import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { getNextServerAfterSet } from '@/core/scoring/edit-score-domain';
import { parsePointValue } from '@/core/scoring/point.logic';

export type * from '@/core/scoring/edit-score-state.types';
import type {
  Player,
  EditScoreState,
  CreateSetEditDataInput,
  ShouldAutoAddSetInput,
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

function applyMatchTiebreakSetData(
  setData: SetEditData,
  p1Val: number,
  p2Val: number,
  matchFormat?: TennisFormat,
) {
  const baseGames = matchFormat === 'BEST_OF_5' ? 6 : 0;
  const winner: Player = p1Val > p2Val ? 'player1' : 'player2';
  setData.p1Games = winner === 'player1' ? baseGames + 1 : baseGames;
  setData.p2Games = winner === 'player2' ? baseGames + 1 : baseGames;
  setData.tiebreakScore = {
    player1: p1Val,
    player2: p2Val,
  };
}

export function createSetEditData(input: CreateSetEditDataInput): SetEditData {
  const {
    p1Val,
    p2Val,
    isSetTrulyCompleted,
    hasTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    isMatchTiebreakSet,
    isPotentialMTSet,
    p1Points,
    p2Points,
    matchFormat,
  } = input;
  const setData: SetEditData = {
    p1Games: p1Val,
    p2Games: p2Val,
    isPartial: !isSetTrulyCompleted,
  };

  if (isMatchTiebreakSet && isSetTrulyCompleted) {
    // MTB concluído: determinar vencedor e atribuir games (ex.: 1x0 ou 0x1)
    applyMatchTiebreakSetData(setData, p1Val, p2Val, matchFormat);
  } else if (isMatchTiebreakSet && !isSetTrulyCompleted) {
    // MTB em andamento (parcial, sem vencedor): preservar pontos sem forçar
    // games de vencedor — evita gravar vencedor errado em placar 4x4.
    setData.tiebreakScore = { player1: p1Val, player2: p2Val };
  } else if (hasTiebreak && !isPotentialMTSet && tiebreakP1Num >= 0 && tiebreakP2Num >= 0) {
    setData.tiebreakScore = {
      player1: tiebreakP1Num,
      player2: tiebreakP2Num,
    };
  } else if (!isSetTrulyCompleted) {
    setData.currentGamePoints = {
      player1: parsePointValue(p1Points),
      player2: parsePointValue(p2Points),
    };
  }

  return setData;
}

export function shouldAutoAddSet(input: ShouldAutoAddSetInput): boolean {
  const { validation, matchState, currentSets, p1Val, p2Val } = input;
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.matchWouldEnd) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver) return false;
  if (matchState.isMatchTiebreakSet) return false;

  const scoreWasChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
  if (!scoreWasChanged) return false;

  return true;
}

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
