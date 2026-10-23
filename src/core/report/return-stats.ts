import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, isWinner, type ReturnStats } from './types';
import { computeCompletedGames } from './serve-return-completed-games';
import { isSecondServePoint, isFirstServePoint } from './serve-stats';

function computeReturnGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean }> {
  const opponentServer = playerIndex === 1 ? 'player2' : 'player1';
  const targetWinner = playerIndex === 1 ? 'PLAYER_1' : 'PLAYER_2';

  const completed = computeCompletedGames(points);
  return completed
    .filter(g => !g.isTiebreak && g.server === opponentServer)
    .map(g => ({
      won: g.winner === targetWinner,
    }));
}

export function computeReturnStats(points: TimelinePoint[], playerIndex: 1 | 2): ReturnStats {
  const returnPoints = points.filter(p => !isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = returnPoints.length;

  const firstServeReturns = returnPoints.filter(isFirstServePoint);
  const firstServeReturnPointsWon = firstServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const firstServeReturnPointsWonPct = firstServeReturns.length > 0
    ? (firstServeReturnPointsWon / firstServeReturns.length) * 100
    : 0;

  const secondServeReturns = returnPoints.filter(isSecondServePoint);
  const secondServeReturnPointsWon = secondServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const secondServeReturnPointsWonPct = secondServeReturns.length > 0
    ? (secondServeReturnPointsWon / secondServeReturns.length) * 100
    : 0;

  const returnGames = computeReturnGames(points, playerIndex);
  const returnGamesPlayed = returnGames.length;
  const returnGamesWon = returnGames.filter(g => g.won).length;
  const returnGamesWonPct = returnGamesPlayed > 0
    ? (returnGamesWon / returnGamesPlayed) * 100
    : 0;

  const breakPointOpportunities = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex)).length;
  const breakPointsConverted = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex) && isWinner(p, playerIndex)).length;
  const breakPointsConvertedPct = breakPointOpportunities > 0
    ? (breakPointsConverted / breakPointOpportunities) * 100
    : 0;

  return {
    totalPoints,
    firstServeReturnPointsWon,
    firstServeReturnPointsWonPct,
    secondServeReturnPointsWon,
    secondServeReturnPointsWonPct,
    returnGamesPlayed,
    returnGamesWon,
    returnGamesWonPct,
    breakPointOpportunities,
    breakPointsConverted,
    breakPointsConvertedPct,
  };
}
