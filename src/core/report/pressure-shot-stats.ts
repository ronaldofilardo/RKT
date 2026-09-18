import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, type PressureStats, type ShotAnalysis } from './types';

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

function calcPercentage(won: number, total: number): number {
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

export function computeShotAnalysis(points: TimelinePoint[], playerIndex: 1 | 2): ShotAnalysis {
  const winner = `PLAYER_${playerIndex}` as const;

  const playerPoints = points.filter(p => p.winner === winner);
  const opponentPoints = points.filter(p => p.winner !== winner);

  const winners = playerPoints.filter(p => p.rallyDetails?.tipo === 'winner').length;
  const winnersByStroke: Record<string, number> = {};
  for (const p of playerPoints) {
    if (p.rallyDetails?.tipo === 'winner' && p.stroke) {
      winnersByStroke[p.stroke] = (winnersByStroke[p.stroke] || 0) + 1;
    }
  }

  const forcedErrors = opponentPoints.filter(p => p.rallyDetails?.tipo === 'erro_forcado').length;
  const unforcedErrors = opponentPoints.filter(p => p.rallyDetails?.tipo === 'erro_nao_forcado').length;

  const netApproaches = points.filter(p => p.rallyDetails?.situacao === 'rede').length;
  const netApproachesWon = points.filter(p => p.rallyDetails?.situacao === 'rede' && p.winner === winner).length;
  const netApproachPct = calcPercentage(netApproachesWon, netApproaches);

  const rallyLengths = points.map(p => p.rallyLength).filter(l => l > 0);
  const rallyAvgLength = rallyLengths.length > 0
    ? rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length
    : 0;

  const short = rallyLengths.filter(l => l <= 4).length;
  const medium = rallyLengths.filter(l => l >= 5 && l <= 8).length;
  const longRallies = rallyLengths.filter(l => l >= 9).length;

  const lobCount = points.filter(p => p.rallyDetails?.golpe_esp === 'lob').length;
  const dropShotCount = points.filter(p => p.rallyDetails?.golpe_esp === 'drop_shot').length;
  const smashCount = points.filter(p => p.rallyDetails?.golpe === 'smash').length;

  return {
    winners,
    winnersByStroke,
    forcedErrors,
    unforcedErrors,
    netApproaches,
    netApproachesWon,
    netApproachPct,
    rallyLengthDistribution: { short, medium, long: longRallies },
    rallyAvgLength,
    lobCount,
    dropShotCount,
    smashCount,
  };
}
