import type { ScoringState } from "@/core/scoring/types";
import type { TennisFormat } from "@/lib/matchConfig";
import { getTiebreakMinimumForSet, isSetCompleted } from "./scoring-set-completed.logic";

function isPlayerOnePointAway(state: ScoringState, player: 'player1' | 'player2', format?: string): boolean {
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  const opponent = player === 'player1' ? 'player2' : 'player1';

  if (set.isTiebreak) {
    const tb = set.tiebreakScore;
    if (!tb) return false;
    const pPts = tb[player];
    const oPts = tb[opponent];
    const tbMin = getTiebreakMinimumForSet(format as TennisFormat, state.sets.length - 1, state.setsWon);
    return pPts >= tbMin - 1 && pPts - oPts >= 1;
  } else {
    const game = state.currentGame;
    if (!game) return false;
    if (game.isDeuce) {
      return game.advantage === player || game.advantage === null;
    }
    return game[player] >= 3 && game[opponent] <= 2;
  }
}

function isPlayerOneGameAwayFromWinningSet(state: ScoringState, player: 'player1' | 'player2', format?: string): boolean {
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  if (set.isTiebreak) return true;

  const simulatedSet = {
    ...set,
    [player]: set[player] + 1
  };
  return isSetCompleted(simulatedSet, format as TennisFormat, state.sets.length - 1, state.setsWon);
}

function isPlayerOneSetAwayFromWinningMatch(state: ScoringState, player: 'player1' | 'player2', format?: string): boolean {
  if (!state.setsWon) return false;
  let setsToWin = 2;
  if (format === 'BEST_OF_5' || format === 'BEST_OF_5_MATCH_TB') setsToWin = 3;
  else if (format === 'MATCH_TB_10') setsToWin = 1;

  return state.setsWon[player] === setsToWin - 1;
}

export function checkMatchPoint(state: ScoringState, format?: string): boolean {
  if (!state || state.isFinished || !state.sets) return false;
  for (const player of ['player1', 'player2'] as const) {
    if (
      isPlayerOnePointAway(state, player, format) &&
      isPlayerOneGameAwayFromWinningSet(state, player, format) &&
      isPlayerOneSetAwayFromWinningMatch(state, player, format)
    ) {
      return true;
    }
  }
  return false;
}

export function checkSetPoint(state: ScoringState, format?: string): boolean {
  if (!state || state.isFinished || !state.sets) return false;
  for (const player of ['player1', 'player2'] as const) {
    if (
      isPlayerOnePointAway(state, player, format) &&
      isPlayerOneGameAwayFromWinningSet(state, player, format)
    ) {
      return true;
    }
  }
  return false;
}

export function checkBreakPoint(state: ScoringState, format?: string): boolean {
  if (!state || state.isFinished || !state.sets) return false;
  const set = state.sets[state.sets.length - 1];
  if (!set || set.isTiebreak) return false;
  
  const receiver = state.server === 'player1' ? 'player2' : 'player1';
  return isPlayerOnePointAway(state, receiver, format);
}
