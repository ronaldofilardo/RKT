import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
export type { SetEditData } from './editScoreHelpers';
import type { validateSetResult } from './editScoreHelpers';

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

export interface TiebreakInput {
  tiebreakP1?: string;
  tiebreakP2?: string;
}

export interface GameScoreInput {
  p1Input: string;
  p2Input: string;
}

export interface ValidationContext {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  setResults?: SetEditData[];
}

export interface EditScoreValidationInput extends GameScoreInput, TiebreakInput, ValidationContext {}

export interface CompletedSetsInput {
  completedSets: CompletedSet[];
}

export interface NewSetsInput {
  newSets: SetEditData[];
}

export interface ValidationResultInput {
  validation: EditScoreValidation;
}

export interface EditScoreMatchStateInput
  extends ValidationContext,
    CompletedSetsInput,
    NewSetsInput,
    ValidationResultInput {
  currentSets?: { player1: number; player2: number };
}

export interface SetResultInput {
  p1Val: number;
  p2Val: number;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  p1Points: string;
  p2Points: string;
  currentSets: { player1: number; player2: number };
  matchFormat?: TennisFormat;
}

export interface CreateSetEditDataInput extends SetResultInput {}

export interface AutoAddSetContext {
  validation: EditScoreValidation;
  matchState: EditScoreMatchState;
  currentSets: { player1: number; player2: number };
}

export interface ShouldAutoAddSetInput extends AutoAddSetContext {
  p1Val: number;
  p2Val: number;
}

export interface NextServerContext {
  currentServer: Player;
  p1Games: number;
  p2Games: number;
  matchFormat: TennisFormat;
  tiebreakScore: { player1: number; player2: number } | null;
  completedSets: CompletedSet[];
}

export interface CalculateNextServerInput extends NextServerContext {}
