export interface NormalizedScoreState {
  sets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
  currentGame?: {
    player1: number | string;
    player2: number | string;
    isDeuce?: boolean;
    advantage?: 'player1' | 'player2' | null;
  };
  setsWon?: { player1: number; player2: number };
  server?: 'player1' | 'player2';
}
