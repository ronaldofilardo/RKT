import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import { isServer, isWinner, type ServeStats } from './types';
import { computeCompletedGames } from './serve-return-completed-games';
import { isTimelineBreakPoint } from './pressure-point-eval.logic';

export function isSecondServePoint(p: TimelinePoint): boolean {
  if (p.type === 'FAULT_FIRST') return false;
  if (p.type === 'DOUBLE_FAULT') return true;
  if (p.firstFault != null || p.pointDetails?.firstFaultDetail != null) return true;
  if (p.isSecondServe === true) return true;
  if (p.isFirstServe === false) return true;
  return false;
}

export function isFirstServePoint(p: TimelinePoint): boolean {
  if (p.type === 'FAULT_FIRST') return false;
  return !isSecondServePoint(p);
}

function computeServiceGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean; startIdx: number; endIdx: number }> {
  const targetServer = playerIndex === 1 ? 'player1' : 'player2';
  const targetWinner = playerIndex === 1 ? 'PLAYER_1' : 'PLAYER_2';

  const completed = computeCompletedGames(points);
  return completed
    .filter(g => !g.isTiebreak && g.server === targetServer)
    .map(g => ({
      won: g.winner === targetWinner,
      startIdx: g.startIdx,
      endIdx: g.endIdx,
    }));
}

export function computeServeStats(points: TimelinePoint[], playerIndex: 1 | 2, format?: TennisFormat): ServeStats {
  const servicePoints = points.filter(p => isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = servicePoints.length;

  const firstServeIn = servicePoints.filter(isFirstServePoint).length;
  const firstServePoints = servicePoints.filter(isFirstServePoint);
  const firstServePct = totalPoints > 0 ? (firstServeIn / totalPoints) * 100 : 0;

  const firstServePointsWon = firstServePoints.filter(p => isWinner(p, playerIndex)).length;
  const firstServePointsWonPct = firstServePoints.length > 0
    ? (firstServePointsWon / firstServePoints.length) * 100
    : 0;

  const secondServePoints = servicePoints.filter(isSecondServePoint);
  const secondServePointsWon = secondServePoints.filter(p => isWinner(p, playerIndex)).length;
  const secondServePointsWonPct = secondServePoints.length > 0
    ? (secondServePointsWon / secondServePoints.length) * 100
    : 0;

  const aces = servicePoints.filter(p => p.type === 'ACE').length;
  const doubleFaults = servicePoints.filter(p => p.type === 'DOUBLE_FAULT').length;

  const serviceGames = computeServiceGames(points, playerIndex);
  const serviceGamesPlayed = serviceGames.length;
  const serviceGamesWon = serviceGames.filter(g => g.won).length;
  const serviceGamesWonPct = serviceGamesPlayed > 0
    ? (serviceGamesWon / serviceGamesPlayed) * 100
    : 0;

  const oppIndex: 1 | 2 = playerIndex === 1 ? 2 : 1;
  const isBpAgainstServer = (p: TimelinePoint) =>
    p.isBreakPoint || isTimelineBreakPoint(p, oppIndex, format);

  const breakPointsFaced = servicePoints.filter(isBpAgainstServer).length;
  const breakPointsSaved = servicePoints.filter(p => isBpAgainstServer(p) && isWinner(p, playerIndex)).length;
  const breakPointsSavedPct = breakPointsFaced > 0
    ? (breakPointsSaved / breakPointsFaced) * 100
    : 0;

  return {
    totalPoints,
    firstServeIn,
    firstServePct,
    firstServePointsWon,
    firstServePointsWonPct,
    secondServePointsWon,
    secondServePointsWonPct,
    aces,
    doubleFaults,
    serviceGamesPlayed,
    serviceGamesWon,
    serviceGamesWonPct,
    breakPointsFaced,
    breakPointsSaved,
    breakPointsSavedPct,
  };
}
