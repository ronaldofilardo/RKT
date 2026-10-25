import type { TimelinePoint, TennisFormat } from './types';
import { computeServeStats } from '../report/serve-stats';
import { isTimelineBreakPoint } from '../report/pressure-point-eval.logic';

export function calculateServiceStats(
  points: TimelinePoint[],
  targetServer: 'player1' | 'player2',
  _targetWinner: 'PLAYER_1' | 'PLAYER_2',
  format?: TennisFormat,
) {
  const playerIndex = targetServer === 'player1' ? 1 : 2;
  const serve = computeServeStats(points, playerIndex, format);

  return {
    totalServicePoints: serve.totalPoints,
    firstServesIn: serve.firstServeIn,
    firstServePct: serve.firstServePct,
    firstServePointsWon: serve.firstServePointsWon,
    firstServePointsWonPct: serve.firstServePointsWonPct,
    secondServesIn: serve.totalPoints - serve.firstServeIn,
    secondServePointsWon: serve.secondServePointsWon,
    secondServePointsWonPct: serve.secondServePointsWonPct,
    aces: serve.aces,
    doubleFaults: serve.doubleFaults,
    breakPointsFaced: serve.breakPointsFaced,
    breakPointsSaved: serve.breakPointsSaved,
    breakPointsSavedPct: serve.breakPointsSavedPct,
  };
}

export function calculateReturnBreakPoints(
  points: TimelinePoint[],
  targetServer: 'player1' | 'player2',
  targetWinner: 'PLAYER_1' | 'PLAYER_2',
  format?: TennisFormat,
) {
  let breakPointsOpportunities = 0;
  let breakPointsConverted = 0;
  const receiverIndex: 1 | 2 = targetServer === 'player1' ? 2 : 1;

  for (const p of points) {
    const isBp = (p.server !== targetServer && p.isBreakPoint) || isTimelineBreakPoint(p, receiverIndex, format);
    if (isBp) {
      breakPointsOpportunities++;
      if (p.winner === targetWinner) {
        breakPointsConverted++;
      }
    }
  }

  const breakPointsConvertedPct =
    breakPointsOpportunities > 0 ? (breakPointsConverted / breakPointsOpportunities) * 100 : 0;

  return {
    breakPointsOpportunities,
    breakPointsConverted,
    breakPointsConvertedPct,
  };
}
