import type { TimelinePoint } from './types';
import { isSecondServePoint } from '../report/serve-return-stats';

function roundOneDecimal(val: number): number {
  return Math.round(val * 10) / 10;
}

function calcPct(numerator: number, denominator: number): number {
  return denominator > 0 ? roundOneDecimal((numerator / denominator) * 100) : 0;
}

export function calculateServiceStats(
  points: TimelinePoint[],
  targetServer: 'player1' | 'player2',
  targetWinner: 'PLAYER_1' | 'PLAYER_2',
) {
  let totalServicePoints = 0;
  let firstServesIn = 0;
  let firstServePointsWon = 0;
  let secondServesIn = 0;
  let secondServePointsWon = 0;
  let aces = 0;
  let doubleFaults = 0;
  let breakPointsFaced = 0;
  let breakPointsSaved = 0;

  for (const p of points) {
    if (p.server !== targetServer) continue;

    totalServicePoints++;
    const is2nd = isSecondServePoint(p);
    const is1st = !is2nd;

    if (p.type === 'ACE') aces++;
    if (p.type === 'DOUBLE_FAULT') doubleFaults++;

    if (is1st) {
      firstServesIn++;
      if (p.winner === targetWinner) firstServePointsWon++;
    } else {
      secondServesIn++;
      if (p.winner === targetWinner) secondServePointsWon++;
    }

    if (p.isBreakPoint) {
      breakPointsFaced++;
      if (p.winner === targetWinner) breakPointsSaved++;
    }
  }

  return {
    totalServicePoints,
    firstServesIn,
    firstServePct: calcPct(firstServesIn, totalServicePoints),
    firstServePointsWon,
    firstServePointsWonPct: calcPct(firstServePointsWon, firstServesIn),
    secondServesIn,
    secondServePointsWon,
    secondServePointsWonPct: calcPct(secondServePointsWon, secondServesIn),
    aces,
    doubleFaults,
    breakPointsFaced,
    breakPointsSaved,
    breakPointsSavedPct: calcPct(breakPointsSaved, breakPointsFaced),
  };
}

export function calculateReturnBreakPoints(
  points: TimelinePoint[],
  targetServer: 'player1' | 'player2',
  targetWinner: 'PLAYER_1' | 'PLAYER_2',
) {
  let breakPointsOpportunities = 0;
  let breakPointsConverted = 0;

  for (const p of points) {
    if (p.server !== targetServer && p.isBreakPoint) {
      breakPointsOpportunities++;
      if (p.winner === targetWinner) {
        breakPointsConverted++;
      }
    }
  }

  return {
    breakPointsOpportunities,
    breakPointsConverted,
    breakPointsConvertedPct: calcPct(breakPointsConverted, breakPointsOpportunities),
  };
}
