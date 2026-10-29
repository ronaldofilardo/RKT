import type { TimelinePoint } from '@/core/scoring/types';

export interface StreakResult {
  longestWinning: number;
  longestLosing: number;
  current: number;
}

export function calculateStreaks(points: TimelinePoint[]): StreakResult {
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
