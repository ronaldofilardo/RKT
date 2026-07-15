import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { parsePointValue } from "@/core/scoring/point-utils";
import { isMatchTiebreakSet } from "./useSessionManager.utils";

interface BuildNewStateOptions {
  setResults: SetEditData[];
  server: "player1" | "player2";
  format: TennisFormat;
  partialSet?: SetEditData;
}

export function buildNewScoringState(options: BuildNewStateOptions): ScoringState {
  const { setResults, server, format, partialSet } = options;
  
  const setsWon = calculateSetsWon(setResults, format);
  const setsToWin = format === 'BEST_OF_5' ? 3 : 2;
  const winner =
    setsWon.player1 >= setsToWin
      ? "player1"
      : setsWon.player2 >= setsToWin
        ? "player2"
        : null;
  const isFinished = winner !== null;

  return {
    sets: setResults.map((set, idx) => {
      const isMatchTiebreak = isMatchTiebreakSet(idx, setResults, format);
      const isRegularTiebreak = !isMatchTiebreak && set.tiebreakScore !== undefined;
      
      if (isMatchTiebreak) {
        return {
          player1: 0,
          player2: 0,
          isTiebreak: true,
          tiebreakScore: { player1: set.p1Games, player2: set.p2Games },
        };
      }
      
      return {
        player1: set.p1Games,
        player2: set.p2Games,
        isTiebreak: isRegularTiebreak || set.p1Games === 6 && set.p2Games === 6,
        tiebreakScore: set.tiebreakScore ?? null,
      };
    }),
    currentGame: buildCurrentGame(setResults, format, partialSet),
    server,
    setsWon,
    isFinished,
    winner,
    startedAt: Date.now(),
    secondServe: false,
  };
}

function buildCurrentGame(
  setResults: SetEditData[],
  format: string,
  partialSet?: SetEditData
): ScoringState["currentGame"] {
  const isLastSet = setResults.length > 0;
  const hasCompletedSetsBefore = setResults.slice(0, -1).some(s => !s.isPartial);
  const isMatchTiebreakSet = format === 'BEST_OF_3_MATCH_TB' && 
    isLastSet && 
    (hasCompletedSetsBefore || setResults.length === 1) &&
    setResults[setResults.length - 1]?.isPartial === false;

  if (isMatchTiebreakSet) {
    return {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    };
  }

  return {
    player1: partialSet && !partialSet.isPartial ? 0 : parsePointValue(partialSet?.currentGamePoints?.player1 ?? 0),
    player2: partialSet && !partialSet.isPartial ? 0 : parsePointValue(partialSet?.currentGamePoints?.player2 ?? 0),
    isDeuce: false,
    advantage: null,
    secondServe: false,
  };
}

function calculateSetsWon(setResults: SetEditData[], format: string): { player1: number; player2: number } {
  let p1Sets = 0;
  let p2Sets = 0;
  
  for (let i = 0; i < setResults.length; i++) {
    const set = setResults[i];
    const isMatchTiebreak = format === 'BEST_OF_3_MATCH_TB' && (i === 2 || (i === 0 && setResults.length === 1));
    
    if (isMatchTiebreak) {
      const p1Won = set.p1Games >= 10 && set.p1Games - set.p2Games >= 2;
      const p2Won = set.p2Games >= 10 && set.p2Games - set.p1Games >= 2;
      if (p1Won) p1Sets++;
      else if (p2Won) p2Sets++;
    } else {
      if (!set.isPartial && set.p1Games > set.p2Games) p1Sets++;
      else if (!set.isPartial && set.p2Games > set.p1Games) p2Sets++;
    }
  }
  
  return { player1: p1Sets, player2: p2Sets };
}