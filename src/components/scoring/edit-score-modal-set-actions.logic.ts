import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import { calculateNextServer } from "@/core/scoring/edit-score-state";
import { getInitialGames } from "@/core/scoring/format-rules";
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from "@/hooks/use-session-manager.logic";
import { toCompletedSetsForServer } from "./use-edit-score-modal-confirm.logic";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { buildNextSetData } from "./edit-score-modal-set-build.logic";

export function performAddSet(params: {
  canAddNextSet: boolean;
  state: EditScoreModalState;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  isMatchTiebreakSet: boolean;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
}) {
  if (!params.canAddNextSet) return;
  const { setData, tiebreakForServer, p1Games, p2Games } = buildNextSetData({
    p1Input: params.state.p1Input,
    p2Input: params.state.p2Input,
    tiebreakP1: params.state.tiebreakP1,
    tiebreakP2: params.state.tiebreakP2,
    isMatchTiebreakSet: params.isMatchTiebreakSet,
  });

  const nextSetIndex = params.completedSets.length + params.state.newSets.length + 1;
  const mockSetResults = [
    ...params.completedSets.map(cs => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false, tiebreakScore: cs.tiebreakScore ?? undefined })),
    ...params.state.newSets,
    setData,
  ];
  const isNextMT = isMatchTiebreakSetUtil(nextSetIndex, mockSetResults, params.matchFormat);
  const initGames = (params.matchFormat && !isNextMT) ? getInitialGames(params.matchFormat) : 0;
  const resetStr = initGames > 0 ? String(initGames) : "";

  params.setState((prev) => ({
    ...prev,
    newSets: [...prev.newSets, setData],
    p1Input: resetStr,
    p2Input: resetStr,
    tiebreakP1: "",
    tiebreakP2: "",
    p1Points: "0",
    p2Points: "0",
    nextServer: calculateNextServer({
      currentServer: params.currentServer,
      initialServer: params.initialServer,
      p1Games,
      p2Games,
      matchFormat: params.matchFormat,
      tiebreakScore: tiebreakForServer,
      completedSets: toCompletedSetsForServer(params.state, params.completedSets, params.matchFormat),
    }),
  }));
}

export function performConfirmSet(
  canConfirmSetCalc: boolean,
  isMatchTiebreakSet: boolean,
  confirmCurrentAction: () => Promise<void>,
  addSetToMatch: () => void,
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>
) {
  if (!canConfirmSetCalc) return;
  if (isMatchTiebreakSet) {
    confirmCurrentAction();
    return;
  }
  addSetToMatch();
  inputTouchedRef.current = { p1: false, p2: false };
}
