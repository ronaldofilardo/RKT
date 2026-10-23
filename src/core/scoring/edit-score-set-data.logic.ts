import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { parsePointValue } from '@/core/scoring/point.logic';
import type {
  Player,
  CreateSetEditDataInput,
  ShouldAutoAddSetInput,
} from '@/core/scoring/edit-score-state.types';

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
