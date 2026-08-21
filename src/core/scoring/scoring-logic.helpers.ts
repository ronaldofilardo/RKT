import type { ScoringState, HistoryEntry } from './types';

export function getSetNumber(stateBefore: ScoringState): number {
  return stateBefore.sets.length > 0 ? stateBefore.sets.length : 1;
}

export function getGamesScore(stateBefore: ScoringState) {
  const currentSet = stateBefore.sets[stateBefore.sets.length - 1];
  return {
    player1: currentSet?.player1 ?? 0,
    player2: currentSet?.player2 ?? 0,
  };
}

export function getGameScore(stateBefore: ScoringState) {
  return {
    player1: stateBefore.currentGame.player1,
    player2: stateBefore.currentGame.player2,
  };
}

export function getRallyLength(point: HistoryEntry['point'], isServeFinish: boolean, isDevolucao: boolean): number {
  return point.rallyLength ?? (isServeFinish ? 1 : isDevolucao ? 2 : 0);
}

export function getFirstFault(point: HistoryEntry['point']) {
  return point.type === 'DOUBLE_FAULT' && point.firstFaultDetail
    ? point.firstFaultDetail
    : undefined;
}
