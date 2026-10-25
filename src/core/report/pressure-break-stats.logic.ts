import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import type { PressureStats } from './types';
import {
  isTimelineBreakPoint,
  isTimelineGamePoint,
  isTimelineSetPoint,
} from './pressure-point-eval.logic';

function countTiebreaks(points: TimelinePoint[], winner: 'PLAYER_1' | 'PLAYER_2'): { played: number; won: number } {
  const tiebreaks = points.filter(p => p.isTiebreak);
  const tiebreakSets = new Set(tiebreaks.map(p => p.setNumber));
  const played = tiebreakSets.size;
  let won = 0;
  for (const setNum of tiebreakSets) {
    const setPoints = tiebreaks.filter(p => p.setNumber === setNum);
    const lastPoint = setPoints[setPoints.length - 1];
    if (lastPoint && lastPoint.winner === winner) {
      won++;
    }
  }
  return { played, won };
}

export function calcPercentage(won: number, total: number): number {
  return total > 0 ? (won / total) * 100 : 0;
}

function computeBreakPointPressure(
  points: TimelinePoint[],
  playerIndex: 1 | 2,
  winner: 'PLAYER_1' | 'PLAYER_2',
  format?: TennisFormat,
) {
  let saved = 0;
  let faced = 0;
  let converted = 0;
  let opps = 0;
  const oppIndex: 1 | 2 = playerIndex === 1 ? 2 : 1;

  for (const p of points) {
    const serverIndex = p.server === 'player1' ? 1 : 2;
    if (serverIndex === playerIndex) {
      const isOppBp = p.isBreakPoint || isTimelineBreakPoint(p, oppIndex, format);
      if (isOppBp) {
        faced++;
        if (p.winner === winner) saved++;
      }
    } else {
      const isMyBp = p.isBreakPoint || isTimelineBreakPoint(p, playerIndex, format);
      if (isMyBp) {
        opps++;
        if (p.winner === winner) converted++;
      }
    }
  }
  return { saved, faced, converted, opps };
}

export function computePressureStats(
  points: TimelinePoint[],
  playerIndex: 1 | 2,
  format?: TennisFormat,
): PressureStats {
  const winner = `PLAYER_${playerIndex}` as const;

  const bp = computeBreakPointPressure(points, playerIndex, winner, format);

  const gamePointsWon = points.filter(p => isTimelineGamePoint(p, playerIndex, format) && p.winner === winner).length;
  const gamePointsTotal = points.filter(p => isTimelineGamePoint(p, playerIndex, format)).length;
  const gamePointsWonPct = calcPercentage(gamePointsWon, gamePointsTotal);

  const setPointsWon = points.filter(p => isTimelineSetPoint(p, playerIndex, format) && p.winner === winner).length;
  const setPointsTotal = points.filter(p => isTimelineSetPoint(p, playerIndex, format)).length;
  const setPointsWonPct = calcPercentage(setPointsWon, setPointsTotal);

  const { played: tiebreaksPlayed, won: tiebreaksWon } = countTiebreaks(points, winner);
  const totalPointsWon = points.filter(p => p.winner === winner).length;

  return {
    breakPointsSaved: bp.saved,
    breakPointsFaced: bp.faced,
    breakPointsConverted: bp.converted,
    breakPointOpportunities: bp.opps,
    gamePointsWon,
    gamePointsTotal,
    gamePointsWonPct,
    setPointsWon,
    setPointsTotal,
    setPointsWonPct,
    tiebreaksPlayed,
    tiebreaksWon,
    totalPointsWon,
  };
}
