import type { TimelinePoint } from '@/core/scoring/types';

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
  maxServeSpeed?: number;
}

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

export interface MomentumStats {
  longestWinningStreak: number;
  longestLosingStreak: number;
  currentStreak: number;
  scoringRuns: Array<{ player: 'PLAYER_1' | 'PLAYER_2'; length: number; start: number; end: number }>;
}

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
  duration?: number;
  p1Aces: number;
  p2Aces: number;
  p1Winners: number;
  p2Winners: number;
  p1Errors: number;
  p2Errors: number;
}

export interface AdvancedMatchStats {
  serve: { player1: ServeStats; player2: ServeStats };
  returnStats: { player1: ReturnStats; player2: ReturnStats };
  pressure: { player1: PressureStats; player2: PressureStats };
  shots: { player1: ShotAnalysis; player2: ShotAnalysis };
  momentum: MomentumStats;
  setBreakdown: SetBreakdown[];
}

export function isServer(p: TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.server === `player${playerIndex}`;
}

export function isWinner(p: TimelinePoint, playerIndex: 1 | 2): boolean {
  return p.winner === `PLAYER_${playerIndex}`;
}
