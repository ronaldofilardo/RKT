import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, type PressureStats } from './types';

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

function computeBreakPointPressure(points: TimelinePoint[], playerIndex: 1 | 2, winner: 'PLAYER_1' | 'PLAYER_2') {
  let saved = 0;
  let faced = 0;
  let converted = 0;
  let opps = 0;
  for (const p of points) {
    if (p.isBreakPoint) {
      if (isServer(p, playerIndex)) {
        faced++;
        if (p.winner === winner) saved++;
      } else {
        opps++;
        if (p.winner === winner) converted++;
      }
    }
  }
  return { saved, faced, converted, opps };
}

export function computePressureStats(points: TimelinePoint[], playerIndex: 1 | 2): PressureStats {
  const winner = `PLAYER_${playerIndex}` as const;

  const bp = computeBreakPointPressure(points, playerIndex, winner);

  const gamePointsWon = points.filter(p => (p.isGameBall || p.gameIsDeuce) && p.winner === winner).length;
  const gamePointsTotal = points.filter(p => p.isGameBall || p.gameIsDeuce).length;
  const gamePointsWonPct = calcPercentage(gamePointsWon, gamePointsTotal);

  const setPointsWon = points.filter(p => p.isSetBall && p.winner === winner).length;
  const setPointsTotal = points.filter(p => p.isSetBall).length;
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
