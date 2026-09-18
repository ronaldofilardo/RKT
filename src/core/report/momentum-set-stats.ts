import type { TimelinePoint } from '@/core/scoring/types';
import type { MomentumStats, SetBreakdown } from './types';

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

function initSetBreakdown(setNumber: number): SetBreakdown {
  return {
    setNumber,
    totalPoints: 0,
    p1Points: 0,
    p2Points: 0,
    p1Games: 0,
    p2Games: 0,
    isTiebreak: false,
    p1Aces: 0,
    p2Aces: 0,
    p1Winners: 0,
    p2Winners: 0,
    p1Errors: 0,
    p2Errors: 0,
  };
}

function updateWinnerAndErrorStats(entry: SetBreakdown, p: TimelinePoint): void {
  const tipo = p.rallyDetails?.tipo;
  if (tipo === 'winner') {
    if (p.winner === 'PLAYER_1') entry.p1Winners++;
    if (p.winner === 'PLAYER_2') entry.p2Winners++;
    return;
  }
  if (tipo === 'erro_forcado' || tipo === 'erro_nao_forcado') {
    if (p.winner === 'PLAYER_2') entry.p1Errors++;
    if (p.winner === 'PLAYER_1') entry.p2Errors++;
  }
}

function updateSetPointStats(entry: SetBreakdown, p: TimelinePoint): void {
  entry.totalPoints++;
  if (p.winner === 'PLAYER_1') entry.p1Points++;
  else entry.p2Points++;

  entry.p1Games = p.gamesScore.player1;
  entry.p2Games = p.gamesScore.player2;
  if (p.isTiebreak) entry.isTiebreak = true;

  if (p.type === 'ACE') {
    if (p.server === 'player1') entry.p1Aces++;
    if (p.server === 'player2') entry.p2Aces++;
  }

  updateWinnerAndErrorStats(entry, p);
}

function calculateSetDuration(points: TimelinePoint[], setNumber: number): number | undefined {
  const setPoints = points.filter(p => p.setNumber === setNumber);
  if (setPoints.length < 2) return undefined;
  const firstTimestamp = setPoints[0].recordedAt;
  const lastTimestamp = setPoints[setPoints.length - 1].recordedAt;
  if (!firstTimestamp || !lastTimestamp) return undefined;
  const first = new Date(firstTimestamp).getTime();
  const last = new Date(lastTimestamp).getTime();
  return first && last ? Math.round((last - first) / 60000) : undefined;
}

export function computeSetBreakdown(points: TimelinePoint[]): SetBreakdown[] {
  const setMap = new Map<number, SetBreakdown>();

  for (const p of points) {
    const s = p.setNumber;
    if (!setMap.has(s)) {
      setMap.set(s, initSetBreakdown(s));
    }
    updateSetPointStats(setMap.get(s)!, p);
  }

  const sets = Array.from(setMap.values());
  for (const set of sets) {
    const duration = calculateSetDuration(points, set.setNumber);
    if (duration !== undefined) {
      set.duration = duration;
    }
  }

  return sets;
}
