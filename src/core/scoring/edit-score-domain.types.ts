export interface SetEditData {
  p1Games: number;
  p2Games: number;
  isPartial: boolean;
  tiebreakScore?: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
}

export interface SetValidation {
  isValid: boolean;
  error?: string;
  winner?: 'player1' | 'player2';
  hasTiebreak?: boolean;
  isPartial?: boolean;
  tiebreakRequired?: boolean;
}
