import type { TimelinePoint } from '@/core/scoring/types';

// ===========================================================================
// 2. FIO DO JOGO (Horizontal Flow Chart dos Scoring Runs + Ponto-a-Ponto)
// ===========================================================================

export interface ChronoRun {
  id: string;
  player: 'PLAYER_1' | 'PLAYER_2';
  length: number;
  startIndex: number;
  endIndex: number;
  startPointNumber: number;
  endPointNumber: number;
  setNumber: number;
  gameScore?: { player1: number; player2: number };
  gamesScore?: { player1: number; player2: number };
  aces: number;
  winners: number;
  breakPoints: number;
  points: TimelinePoint[];
}

function buildRun(
  currentWinner: 'PLAYER_1' | 'PLAYER_2',
  currentPoints: TimelinePoint[],
  startIndex: number,
  endIndex: number,
): ChronoRun {
  return {
    id: `run-${startIndex}-${endIndex}`,
    player: currentWinner,
    length: currentPoints.length,
    startIndex,
    endIndex,
    startPointNumber: currentPoints[0].pointNumber,
    endPointNumber: currentPoints[currentPoints.length - 1].pointNumber,
    setNumber: currentPoints[0].setNumber,
    gameScore: currentPoints[currentPoints.length - 1].gameScore,
    gamesScore: currentPoints[currentPoints.length - 1].gamesScore,
    aces: currentPoints.filter((p) => p.type === 'ACE').length,
    winners: currentPoints.filter((p) => p.type === 'WINNER').length,
    breakPoints: currentPoints.filter((p) => p.isBreakPoint).length,
    points: [...currentPoints],
  };
}

export function extractChronologicalRuns(points: TimelinePoint[]): ChronoRun[] {
  if (!points || points.length === 0) return [];

  const runs: ChronoRun[] = [];
  let currentWinner = points[0].winner;
  let currentPoints: TimelinePoint[] = [points[0]];
  let startIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.winner === currentWinner) {
      currentPoints.push(pt);
    } else {
      if (currentPoints.length >= 2) {
        runs.push(buildRun(currentWinner, currentPoints, startIndex, i - 1));
      }
      currentWinner = pt.winner;
      currentPoints = [pt];
      startIndex = i;
    }
  }

  if (currentPoints.length >= 2) {
    runs.push(buildRun(currentWinner, currentPoints, startIndex, points.length - 1));
  }

  return runs;
}
