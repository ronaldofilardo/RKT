import type { SetEditData } from '@/core/scoring/edit-score-domain';

export type PlayerSide = 'player1' | 'player2';
export type FloorSets = { player1: number; player2: number };
export type PointParser = (value: string) => number;
export type PointProgress = (value: number) => number;

export type ValidationData = {
  setValidationError?: string | null;
  setValidation?: { winner?: PlayerSide; tiebreakRequired?: boolean } | null;
};

export type MatchState = {
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
};

export type EditableSet = Omit<SetEditData, 'tiebreakScore'> & { tiebreakScore?: SetEditData['tiebreakScore'] | null };

export type EditableState = {
  editableCompletedSets?: EditableSet[];
  newSets: SetEditData[];
  p1Points: string;
  p2Points: string;
};

export type ValidationArgs = {
  floorValidationError: string | null;
  validation: ValidationData;
  partial: boolean;
  bothFilled: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  hasValidTiebreak: boolean;
  p1Val: number;
  p2Val: number;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  matchWouldEnd: boolean;
  matchState: MatchState;
  setsToWin: number;
  setWinner: PlayerSide;
  playerNames: { p1: string; p2: string };
  floorCurrentSets?: FloorSets | null;
  canAddNextSet: boolean;
  maxSets: number;
  initialGame: { player1: string; player2: string } | null;
  currentSets: FloorSets;
  p1Points: string;
  p2Points: string;
  parsePointValue: PointParser;
  pointToProgress: PointProgress;
};
