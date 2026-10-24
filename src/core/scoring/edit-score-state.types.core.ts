import type { SetEditData } from '@/core/scoring/edit-score-domain';
export type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { validateSetResult } from '@/core/scoring/edit-score-domain';

export type Player = 'player1' | 'player2';

export interface CompletedSet {
  games: Record<Player, number>;
  winner: Player;
  tiebreakScore?: { player1: number; player2: number };
}

export interface EditScoreState {
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  nextServer: Player;
  tiebreakP1: string;
  tiebreakP2: string;
  newSets: SetEditData[];
  note?: string;
}

export interface EditScoreValidation {
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  setValidation: ReturnType<typeof validateSetResult> | null;
  hasWinner: boolean;
  completed: boolean;
  isSetTrulyCompleted: boolean;
  setValidationError: string | undefined;
  hasTiebreak: boolean;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  tiebreakComplete?: boolean;
  tiebreakImpossible?: boolean;
  hasValidTiebreak?: boolean;
  tiebreakP1Num?: number;
  tiebreakP2Num?: number;
}

export interface EditScoreMatchState {
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
  p1SetsWon: number;
  p2SetsWon: number;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  totalEditedSets: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  maxSets: number;
  setsToWin: number;
  currentSets?: { player1: number; player2: number };
}
