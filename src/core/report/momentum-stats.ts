import type { TimelinePoint } from '@/core/scoring/types';
import type { MomentumStats } from './types';

function extractScoringRuns(points: TimelinePoint[]): MomentumStats['scoringRuns'] {
  const runs: MomentumStats['scoringRuns'] = [];
  let currentRun = 1;
  let currentWinner = points[0].winner;
  let runStart = 0;

  for (let i = 1; i < points.length; i++) {
    if (points[i].winner === currentWinner) {
      currentRun++;
    } else {
      if (currentRun >= 3) {
        runs.push({
          player: currentWinner,
          length: currentRun,
          start: runStart,
          end: i - 1,
        });
      }
      currentWinner = points[i].winner;
      currentRun = 1;
      runStart = i;
    }
  }

  if (currentRun >= 3) {
    runs.push({
      player: currentWinner,
      length: currentRun,
      start: runStart,
      end: points.length - 1,
    });
  }

  runs.sort((a, b) => b.length - a.length);
  return runs;
}

function calculateStreaks(points: TimelinePoint[]): { longestWinning: number; longestLosing: number; current: number } {
  let longestWinning = 0;
  let longestLosing = 0;
  let streak = 0;
  let streakWinner = points[0].winner;

  for (const p of points) {
    if (p.winner === streakWinner) {
      streak++;
    } else {
      if (streakWinner === 'PLAYER_1') {
        longestWinning = Math.max(longestWinning, streak);
      } else {
        longestLosing = Math.max(longestLosing, streak);
      }
      streakWinner = p.winner;
      streak = 1;
    }
  }
  if (streakWinner === 'PLAYER_1') {
    longestWinning = Math.max(longestWinning, streak);
  } else {
    longestLosing = Math.max(longestLosing, streak);
  }

  let currentStreak = 0;
  const lastWinner = points[points.length - 1].winner;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].winner === lastWinner) currentStreak++;
    else break;
  }
  if (lastWinner === 'PLAYER_2') currentStreak = -currentStreak;

  return { longestWinning, longestLosing, current: currentStreak };
}

export function computeMomentum(points: TimelinePoint[]): MomentumStats {
  if (points.length === 0) {
    return {
      longestWinningStreak: 0,
      longestLosingStreak: 0,
      currentStreak: 0,
      scoringRuns: [],
    };
  }

  const scoringRuns = extractScoringRuns(points);
  const { longestWinning, longestLosing, current } = calculateStreaks(points);

  return {
    longestWinningStreak: longestWinning,
    longestLosingStreak: longestLosing,
    currentStreak: current,
    scoringRuns,
  };
}
