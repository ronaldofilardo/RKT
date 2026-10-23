import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { calculateNextServer } from "@/core/scoring/edit-score-state";
import { getCompletedSets } from "./use-edit-score-modal-confirm.logic";

function calculateServerForExistingSets(
  existingSets: SetEditData[],
  currentServer: "player1" | "player2",
  matchFormat: TennisFormat,
  initialServer?: "player1" | "player2",
): "player1" | "player2" {
  const lastExistingSet = existingSets[existingSets.length - 1];
  const priorExistingSets = existingSets.slice(0, -1).map((s) => ({
    games: { player1: s.p1Games, player2: s.p2Games } as Record<'player1' | 'player2', number>,
    winner: (s.p1Games > s.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
    ...(s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
  }));

  return calculateNextServer({
    currentServer,
    initialServer,
    p1Games: lastExistingSet.p1Games,
    p2Games: lastExistingSet.p2Games,
    matchFormat,
    tiebreakScore: lastExistingSet.tiebreakScore ?? null,
    completedSets: priorExistingSets,
  }) || currentServer;
}

function appendPartialGamePointsSet(
  existingSets: SetEditData[],
  state: EditScoreModalState,
  scoresAreZero: boolean,
) {
  const hasGamePointsChanged = (Number(state.p1Points) || 0) > 0 || (Number(state.p2Points) || 0) > 0;
  const lastNewSet = state.newSets[state.newSets.length - 1];
  if (scoresAreZero && hasGamePointsChanged && !lastNewSet?.isPartial) {
    existingSets.push({
      p1Games: 0,
      p2Games: 0,
      isPartial: true,
      currentGamePoints: { player1: state.p1Points, player2: state.p2Points },
    });
  }
}

export function buildExistingSetsPayload(params: {
  state: EditScoreModalState;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
}): { shouldSave: boolean; existingSets: SetEditData[]; recalculatedServer: "player1" | "player2" } {
  const { state, completedSets, matchFormat, currentServer, initialServer, bothFilled, p1Val, p2Val } = params;
  const scoresAreZero = bothFilled && p1Val === 0 && p2Val === 0;
  const existingSets = [...getCompletedSets(state, completedSets, matchFormat), ...state.newSets];

  if ((bothFilled && !scoresAreZero) || existingSets.length === 0) {
    return { shouldSave: false, existingSets: [], recalculatedServer: currentServer };
  }

  const recalculatedServer = calculateServerForExistingSets(existingSets, currentServer, matchFormat, initialServer);
  appendPartialGamePointsSet(existingSets, state, scoresAreZero);

  return { shouldSave: true, existingSets, recalculatedServer };
}
