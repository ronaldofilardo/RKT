import type { TimelinePoint } from '@/core/scoring/types';

// ─── Serve Analysis ──────────────────────────────────────────────────────────

export interface ServeStats {
  totalPoints: number;
  firstServeIn: number;
  firstServePct: number;
  firstServePointsWon: number;
  firstServePointsWonPct: number;
  secondServePointsWon: number;
  secondServePointsWonPct: number;
  aces: number;
  doubleFaults: number;
  serviceGamesPlayed: number;
  serviceGamesWon: number;
  serviceGamesWonPct: number;
  breakPointsFaced: number;
  breakPointsSaved: number;
  breakPointsSavedPct: number;
  maxServeSpeed?: number; // placeholder for future
}

// ─── Return Analysis ─────────────────────────────────────────────────────────

export interface ReturnStats {
  totalPoints: number;
  firstServeReturnPointsWon: number;
  firstServeReturnPointsWonPct: number;
  secondServeReturnPointsWon: number;
  secondServeReturnPointsWonPct: number;
  returnGamesPlayed: number;
  returnGamesWon: number;
  returnGamesWonPct: number;
  breakPointOpportunities: number;
  breakPointsConverted: number;
  breakPointsConvertedPct: number;
}

// ─── Pressure Points ─────────────────────────────────────────────────────────

export interface PressureStats {
  breakPointsSaved: number;
  breakPointsFaced: number;
  breakPointsConverted: number;
  breakPointOpportunities: number;
  gamePointsWon: number;
  gamePointsTotal: number;
  gamePointsWonPct: number;
  setPointsWon: number;
  setPointsTotal: number;
  setPointsWonPct: number;
  tiebreaksPlayed: number;
  tiebreaksWon: number;
  totalPointsWon: number;
}

// ─── Shot Analysis ───────────────────────────────────────────────────────────

export interface ShotAnalysis {
  winners: number;
  winnersByStroke: Record<string, number>;
  forcedErrors: number;
  unforcedErrors: number;
  netApproaches: number;
  netApproachesWon: number;
  netApproachPct: number;
  rallyLengthDistribution: { short: number; medium: number; long: number };
  rallyAvgLength: number;
  lobCount: number;
  dropShotCount: number;
  smashCount: number;
}

// ─── Momentum ────────────────────────────────────────────────────────────────

export interface MomentumStats {
  longestWinningStreak: number;
  longestLosingStreak: number;
  currentStreak: number; // positive = winning, negative = losing
  scoringRuns: Array<{ player: 'PLAYER_1' | 'PLAYER_2'; length: number; start: number; end: number }>;
}

// ─── Set Breakdown ───────────────────────────────────────────────────────────

export interface SetBreakdown {
  setNumber: number;
  totalPoints: number;
  p1Points: number;
  p2Points: number;
  p1Games: number;
  p2Games: number;
  isTiebreak: boolean;
  tiebreakP1?: number;
  tiebreakP2?: number;
  duration?: number; // minutes (approx from timestamps)
  p1Aces: number;
  p2Aces: number;
  p1Winners: number;
  p2Winners: number;
  p1Errors: number;
  p2Errors: number;
}

// ─── Full Advanced Report ────────────────────────────────────────────────────

export interface AdvancedMatchStats {
  serve: { player1: ServeStats; player2: ServeStats };
  returnStats: { player1: ReturnStats; player2: ReturnStats };
  pressure: { player1: PressureStats; player2: PressureStats };
  shots: { player1: ShotAnalysis; player2: ShotAnalysis };
  momentum: MomentumStats;
  setBreakdown: SetBreakdown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isServer(p: TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.server === `player${playerIndex}`;
}

function isWinner(p: TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.winner === `PLAYER_${playerIndex}`;
}

// ─── Serve Stats ─────────────────────────────────────────────────────────────

function computeServeStats(points: TimelinePoint[], playerIndex: 1 | 2): ServeStats {
  const servicePoints = points.filter(p => isServer(p, playerIndex));
  const totalPoints = servicePoints.length;

  const firstServeIn = servicePoints.filter(p => p.isFirstServe && p.type !== 'FAULT_FIRST').length;
  const firstServePoints = servicePoints.filter(p => p.isFirstServe);
  const firstServePct = totalPoints > 0 ? (firstServeIn / totalPoints) * 100 : 0;

  const firstServePointsWon = firstServePoints.filter(p => isWinner(p, playerIndex)).length;
  const firstServePointsWonPct = firstServePoints.length > 0
    ? (firstServePointsWon / firstServePoints.length) * 100
    : 0;

  const secondServePoints = servicePoints.filter(p => p.isSecondServe);
  const secondServePointsWon = secondServePoints.filter(p => isWinner(p, playerIndex)).length;
  const secondServePointsWonPct = secondServePoints.length > 0
    ? (secondServePointsWon / secondServePoints.length) * 100
    : 0;

  const aces = servicePoints.filter(p => p.type === 'ACE').length;
  const doubleFaults = servicePoints.filter(p => p.type === 'DOUBLE_FAULT').length;

  // Service games: count transitions (each game = sequence of points ending in game win/loss)
  const serviceGames = computeServiceGames(points, playerIndex);
  const serviceGamesPlayed = serviceGames.length;
  const serviceGamesWon = serviceGames.filter(g => g.won).length;
  const serviceGamesWonPct = serviceGamesPlayed > 0
    ? (serviceGamesWon / serviceGamesPlayed) * 100
    : 0;

  const breakPointsFaced = servicePoints.filter(p => p.isBreakPoint && !isWinner(p, playerIndex)).length;
  const breakPointsSaved = servicePoints.filter(p => p.isBreakPoint && isWinner(p, playerIndex)).length;
  const breakPointsSavedPct = breakPointsFaced > 0
    ? (breakPointsSaved / breakPointsFaced) * 100
    : 0;

  return {
    totalPoints,
    firstServeIn,
    firstServePct,
    firstServePointsWon,
    firstServePointsWonPct,
    secondServePointsWon,
    secondServePointsWonPct,
    aces,
    doubleFaults,
    serviceGamesPlayed,
    serviceGamesWon,
    serviceGamesWonPct,
    breakPointsFaced,
    breakPointsSaved,
    breakPointsSavedPct,
  };
}

function computeServiceGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean; startIdx: number; endIdx: number }> {
  const games: Array<{ won: boolean; startIdx: number; endIdx: number }> = [];
  let gameStart = 0;
  let currentSet = 1;
  let currentGamesP1 = 0;
  let currentGamesP2 = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (p.setNumber > currentSet) {
      currentSet = p.setNumber;
      currentGamesP1 = 0;
      currentGamesP2 = 0;
    }

    const gameScore = p.gamesScore;
    const newGamesP1 = gameScore.player1;
    const newGamesP2 = gameScore.player2;

    // Detect game completion: games changed and point was on serve
    if (isServer(p, playerIndex)) {
      const prevGames = currentGamesP1 + currentGamesP2;
      const newGames = newGamesP1 + newGamesP2;
      if (newGames > prevGames || (i === points.length - 1)) {
        // Game ended (or match ended)
        const won = isWinner(p, playerIndex);
        games.push({ won, startIdx: gameStart, endIdx: i });
        gameStart = i + 1;
      }
    }

    currentGamesP1 = newGamesP1;
    currentGamesP2 = newGamesP2;
  }

  return games;
}

// ─── Return Stats ────────────────────────────────────────────────────────────

function computeReturnStats(points: TimelinePoint[], playerIndex: 1 | 2): ReturnStats {
  const returnPoints = points.filter(p => !isServer(p, playerIndex));
  const totalPoints = returnPoints.length;

  const firstServeReturns = returnPoints.filter(p => p.isFirstServe);
  const firstServeReturnPointsWon = firstServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const firstServeReturnPointsWonPct = firstServeReturns.length > 0
    ? (firstServeReturnPointsWon / firstServeReturns.length) * 100
    : 0;

  const secondServeReturns = returnPoints.filter(p => p.isSecondServe);
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

  const breakPointOpportunities = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex)).length;
  const breakPointsConverted = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex) && isWinner(p, playerIndex)).length;
  const breakPointsConvertedPct = breakPointOpportunities > 0
    ? (breakPointsConverted / breakPointOpportunities) * 100
    : 0;

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
  };
}

function computeReturnGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean }> {
  const games: Array<{ won: boolean }> = [];
  let currentSet = 1;
  let currentGamesP1 = 0;
  let currentGamesP2 = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.setNumber > currentSet) {
      currentSet = p.setNumber;
      currentGamesP1 = 0;
      currentGamesP2 = 0;
    }

    const gameScore = p.gamesScore;
    const prevGames = currentGamesP1 + currentGamesP2;
    const newGames = gameScore.player1 + gameScore.player2;

    if (!isServer(p, playerIndex) && newGames > prevGames) {
      games.push({ won: isWinner(p, playerIndex) });
    }

    currentGamesP1 = gameScore.player1;
    currentGamesP2 = gameScore.player2;
  }

  return games;
}

// ─── Pressure Stats ──────────────────────────────────────────────────────────

function computePressureStats(points: TimelinePoint[], playerIndex: 1 | 2): PressureStats {
  const winner = `PLAYER_${playerIndex}` as const;

  const breakPointsSaved = points.filter(p => p.isBreakPoint && isServer(p, playerIndex) && p.winner === winner).length;
  const breakPointsFaced = points.filter(p => p.isBreakPoint && isServer(p, playerIndex)).length;
  const breakPointsConverted = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex) && p.winner === winner).length;
  const breakPointOpportunities = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex)).length;

  const gamePointsWon = points.filter(p => (p.isGameBall || p.gameIsDeuce) && p.winner === winner).length;
  const gamePointsTotal = points.filter(p => p.isGameBall || p.gameIsDeuce).length;
  const gamePointsWonPct = gamePointsTotal > 0 ? (gamePointsWon / gamePointsTotal) * 100 : 0;

  const setPointsWon = points.filter(p => p.isSetBall && p.winner === winner).length;
  const setPointsTotal = points.filter(p => p.isSetBall).length;
  const setPointsWonPct = setPointsTotal > 0 ? (setPointsWon / setPointsTotal) * 100 : 0;

  const tiebreaks = points.filter(p => p.isTiebreak);
  const tiebreakSets = new Set(tiebreaks.map(p => p.setNumber));
  const tiebreaksPlayed = tiebreakSets.size;
  let tiebreaksWon = 0;
  for (const setNum of tiebreakSets) {
    const setPoints = tiebreaks.filter(p => p.setNumber === setNum);
    const lastPoint = setPoints[setPoints.length - 1];
    if (lastPoint && lastPoint.winner === winner) tiebreaksWon++;
  }

  const totalPointsWon = points.filter(p => p.winner === winner).length;

  return {
    breakPointsSaved,
    breakPointsFaced,
    breakPointsConverted,
    breakPointOpportunities,
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

// ─── Shot Analysis ───────────────────────────────────────────────────────────

function computeShotAnalysis(points: TimelinePoint[], playerIndex: 1 | 2): ShotAnalysis {
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
  const netApproachPct = netApproaches > 0 ? (netApproachesWon / netApproaches) * 100 : 0;

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

// ─── Momentum ────────────────────────────────────────────────────────────────

function computeMomentum(points: TimelinePoint[]): MomentumStats {
  if (points.length === 0) {
    return {
      longestWinningStreak: 0,
      longestLosingStreak: 0,
      currentStreak: 0,
      scoringRuns: [],
    };
  }

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

  // Final run
  if (currentRun >= 3) {
    runs.push({
      player: currentWinner,
      length: currentRun,
      start: runStart,
      end: points.length - 1,
    });
  }

  runs.sort((a, b) => b.length - a.length);

  // Streaks
  let longestWinning = 0;
  let longestLosing = 0;
  let streak = 0;
  let streakWinner = points[0].winner;

  for (const p of points) {
    if (p.winner === streakWinner) {
      streak++;
    } else {
      if (streakWinner === 'PLAYER_1') longestWinning = Math.max(longestWinning, streak);
      else longestLosing = Math.max(longestLosing, streak);
      streakWinner = p.winner;
      streak = 1;
    }
  }
  if (streakWinner === 'PLAYER_1') longestWinning = Math.max(longestWinning, streak);
  else longestLosing = Math.max(longestLosing, streak);

  // Current streak
  let currentStreak = 0;
  const lastWinner = points[points.length - 1].winner;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].winner === lastWinner) currentStreak++;
    else break;
  }
  if (lastWinner === 'PLAYER_2') currentStreak = -currentStreak;

  return {
    longestWinningStreak: longestWinning,
    longestLosingStreak: longestLosing,
    currentStreak,
    scoringRuns: runs,
  };
}

// ─── Set Breakdown ───────────────────────────────────────────────────────────

function computeSetBreakdown(points: TimelinePoint[]): SetBreakdown[] {
  const setMap = new Map<number, SetBreakdown>();

  for (const p of points) {
    const s = p.setNumber;
    if (!setMap.has(s)) {
      setMap.set(s, {
        setNumber: s,
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
      });
    }
    const entry = setMap.get(s)!;
    entry.totalPoints++;

    if (p.winner === 'PLAYER_1') entry.p1Points++;
    else entry.p2Points++;

    entry.p1Games = p.gamesScore.player1;
    entry.p2Games = p.gamesScore.player2;
    if (p.isTiebreak) entry.isTiebreak = true;

    if (p.type === 'ACE' && p.server === 'player1') entry.p1Aces++;
    if (p.type === 'ACE' && p.server === 'player2') entry.p2Aces++;

    if (p.rallyDetails?.tipo === 'winner' && p.winner === 'PLAYER_1') entry.p1Winners++;
    if (p.rallyDetails?.tipo === 'winner' && p.winner === 'PLAYER_2') entry.p2Winners++;

    if ((p.rallyDetails?.tipo === 'erro_forcado' || p.rallyDetails?.tipo === 'erro_nao_forcado') && p.winner === 'PLAYER_2') entry.p1Errors++;
    if ((p.rallyDetails?.tipo === 'erro_forcado' || p.rallyDetails?.tipo === 'erro_nao_forcado') && p.winner === 'PLAYER_1') entry.p2Errors++;
  }

  // Approximate duration from timestamps
  const sets = Array.from(setMap.values());
  for (const set of sets) {
    const setPoints = points.filter(p => p.setNumber === set.setNumber);
    if (setPoints.length >= 2) {
      const firstTimestamp = setPoints[0].recordedAt;
      const lastTimestamp = setPoints[setPoints.length - 1].recordedAt;
      if (firstTimestamp && lastTimestamp) {
        const first = new Date(firstTimestamp).getTime();
        const last = new Date(lastTimestamp).getTime();
        if (first && last) {
          set.duration = Math.round((last - first) / 60000);
        }
      }
    }
  }

  return sets;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function computeAdvancedStats(points: TimelinePoint[]): AdvancedMatchStats {
  return {
    serve: {
      player1: computeServeStats(points, 1),
      player2: computeServeStats(points, 2),
    },
    returnStats: {
      player1: computeReturnStats(points, 1),
      player2: computeReturnStats(points, 2),
    },
    pressure: {
      player1: computePressureStats(points, 1),
      player2: computePressureStats(points, 2),
    },
    shots: {
      player1: computeShotAnalysis(points, 1),
      player2: computeShotAnalysis(points, 2),
    },
    momentum: computeMomentum(points),
    setBreakdown: computeSetBreakdown(points),
  };
}
