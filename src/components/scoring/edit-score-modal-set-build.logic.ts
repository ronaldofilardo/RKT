import type { TennisFormat } from "@/core/scoring/types";
import { validateSetResult } from '@/core/scoring/edit-score-domain';
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { SetEditData } from '@/core/scoring/edit-score-domain';

export function validateCompletedSetEdit(params: {
  p1Games: number;
  p2Games: number;
  matchFormat: TennisFormat;
  originalSet?: CompletedSet;
  floorCurrentSets?: { player1: number; player2: number } | null;
}): string | null {
  const { p1Games, p2Games, matchFormat, originalSet } = params;
  const validation = validateSetResult({ p1Games, p2Games }, matchFormat);
  if (validation.error && !validation.isPartial) {
    return validation.error;
  }
  if (originalSet) {
    const editedWinner = p1Games > p2Games ? "player1" : "player2";
    if (editedWinner !== originalSet.winner) {
      return "Não é possível inverter o vencedor de um set concluído";
    }
  }
  return null;
}

export function buildNextSetData(params: {
  p1Input: string;
  p2Input: string;
  tiebreakP1: string;
  tiebreakP2: string;
  isMatchTiebreakSet: boolean;
}): { setData: SetEditData; tiebreakForServer: { player1: number; player2: number } | null; p1Games: number; p2Games: number } {
  const p1Games = parseInt(params.p1Input, 10) || 0;
  const p2Games = parseInt(params.p2Input, 10) || 0;
  const tbP1Num = parseInt(params.tiebreakP1, 10);
  const tbP2Num = parseInt(params.tiebreakP2, 10);
  const hasTiebreakScore = !isNaN(tbP1Num) && !isNaN(tbP2Num) && tbP1Num >= 0 && tbP2Num >= 0;

  const setData: SetEditData = {
    p1Games,
    p2Games,
    isPartial: false,
    ...(hasTiebreakScore ? { tiebreakScore: { player1: tbP1Num, player2: tbP2Num } } : {}),
  };

  const tiebreakForServer = params.isMatchTiebreakSet
    ? { player1: p1Games, player2: p2Games }
    : hasTiebreakScore
      ? { player1: tbP1Num, player2: tbP2Num }
      : null;

  return { setData, tiebreakForServer, p1Games, p2Games };
}
