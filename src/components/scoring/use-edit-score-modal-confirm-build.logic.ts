import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { TennisFormat } from "@/core/scoring/types";
import { calculateNextServer } from "@/core/scoring/edit-score-state";
import { getCompletedSets, toCompletedSetsForServer } from "./use-edit-score-modal-confirm.logic";
import type { EditScoreModalState } from "./useEditScoreModal.types";

/**
 * Monta o conjunto final de sets (existentes + novos) e o próximo sacador
 * para a confirmação de edição de score.
 */
export function buildConfirmSubmission(params: {
  state: EditScoreModalState;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  setData: SetEditData;
  p1Val: number;
  p2Val: number;
  tiebreakComplete: boolean | undefined;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
}): { allSets: SetEditData[]; nextServer: "player1" | "player2" } {
  const { state, completedSets, matchFormat, currentServer, setData, p1Val, p2Val, tiebreakComplete, tiebreakP1Num, tiebreakP2Num } = params;
  const allCompletedSetsForServer: CompletedSet[] = [
    ...toCompletedSetsForServer(state, completedSets, matchFormat),
    ...state.newSets.map((ns) => ({
      games: { player1: ns.p1Games, player2: ns.p2Games } as Record<'player1' | 'player2', number>,
      winner: (ns.p1Games > ns.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
      tiebreakScore: ns.tiebreakScore,
    })),
  ];

  const nextServer = calculateNextServer({
    currentServer,
    initialServer: params.initialServer,
    p1Games: p1Val,
    p2Games: p2Val,
    matchFormat,
    tiebreakScore: (tiebreakComplete || tiebreakP1Num > 0 || tiebreakP2Num > 0)
      ? { player1: tiebreakP1Num, player2: tiebreakP2Num }
      : null,
    completedSets: allCompletedSetsForServer,
  }) || currentServer;

  const allNewSetsForConfirm = [...state.newSets, setData];
  const allSets = [...getCompletedSets(state, completedSets, matchFormat), ...allNewSetsForConfirm];

  return { allSets, nextServer };
}
