import type { GameErrorEntry } from './game-errors';

export interface PlayerSetStats {
  totalServicePoints: number;
  firstServesIn: number;
  firstServePct: number;
  firstServePointsWon: number;
  firstServePointsWonPct: number;
  secondServesIn: number;
  secondServePointsWon: number;
  secondServePointsWonPct: number;
  aces: number;
  doubleFaults: number;
  breakPointsOpportunities: number;
  breakPointsConverted: number;
  breakPointsConvertedPct: number;
  breakPointsFaced: number;
  breakPointsSaved: number;
  breakPointsSavedPct: number;
  totalPointsWon: number;
  totalErrors: number;
  unforcedErrors: number;
  forcedErrors: number;
}

export interface SetSummaryReport {
  setNumber: number;
  isCompleted: boolean;
  score: {
    player1: number;
    player2: number;
    tiebreakScore?: { player1: number; player2: number };
  };
  winner: 'player1' | 'player2' | null;
  totalPoints: number;
  durationMinutes?: number;
  player1: PlayerSetStats;
  player2: PlayerSetStats;
  gameErrors: GameErrorEntry[];
}
