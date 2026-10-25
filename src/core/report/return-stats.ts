import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import { isServer, isWinner, type ReturnStats } from './types';
import { computeCompletedGames } from './serve-return-completed-games';
import { isSecondServePoint, isFirstServePoint } from './serve-stats';
import { isTimelineBreakPoint } from './pressure-point-eval.logic';

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

export function computeReturnStats(points: TimelinePoint[], playerIndex: 1 | 2, format?: TennisFormat): ReturnStats {
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

  const isBpForPlayer = (p: TimelinePoint) =>
    (p.isBreakPoint && !isServer(p, playerIndex)) || isTimelineBreakPoint(p, playerIndex, format);

  const breakPointOpportunities = points.filter(isBpForPlayer).length;
  const breakPointsConverted = points.filter(p => isBpForPlayer(p) && isWinner(p, playerIndex)).length;
  const breakPointsConvertedPct = breakPointOpportunities > 0
    ? (breakPointsConverted / breakPointOpportunities) * 100
    : 0;

  const doubleFaults = returnPoints.filter(p => p.type === 'DOUBLE_FAULT').length;
  const totalReturnPoints = Math.max(0, totalPoints - doubleFaults);
  const returnPointsWon = returnPoints.filter(p => isWinner(p, playerIndex)).length;
  const returnPointsWonPct = totalReturnPoints > 0 ? (returnPointsWon / totalReturnPoints) * 100 : 0;

  const isReturnErr = (p: TimelinePoint) =>
    !isWinner(p, playerIndex) &&
    (p.rallyDetails?.situacao === 'devolucao' || p.rallyDetails?.subtipo1 === 'devolucao_saque') &&
    (p.type === 'UNFORCED_ERROR' || p.type === 'FORCED_ERROR' || p.rallyDetails?.tipo === 'erro_nao_forcado' || p.rallyDetails?.tipo === 'erro_forcado');

  const firstAces = firstServeReturns.filter(p => p.type === 'ACE').length;
  const firstReturnErrors = firstServeReturns.filter(isReturnErr).length;
  const firstIn = Math.max(0, firstServeReturns.length - firstAces - firstReturnErrors);
  const firstServeReturnInPct = firstServeReturns.length > 0 ? (firstIn / firstServeReturns.length) * 100 : 0;

  const secondPlayable = secondServeReturns.filter(p => p.type !== 'DOUBLE_FAULT');
  const secondAces = secondPlayable.filter(p => p.type === 'ACE').length;
  const secondReturnErrors = secondPlayable.filter(isReturnErr).length;
  const secondIn = Math.max(0, secondPlayable.length - secondAces - secondReturnErrors);
  const secondServeReturnInPct = secondPlayable.length > 0 ? (secondIn / secondPlayable.length) * 100 : 0;

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
    totalReturnPoints,
    returnPointsWon,
    returnPointsWonPct,
    firstServeReturnInPct,
    secondServeReturnInPct,
  };
}
