export interface Player {
  id: string;
  name: string;
}

/** Forma mínima de set lida pelo card. */
export interface ScoreboardSet {
  player1: number;
  player2: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1: number; player2: number } | null;
}

/** Forma mínima de estado lida pelo card (o normalizador cobre as variantes). */
export interface ScoreboardScoreState {
  sets?: ScoreboardSet[];
  setsWon?: { player1: number; player2: number };
  isFinished?: boolean;
  winner?: 'player1' | 'player2' | null;
  server?: 'player1' | 'player2' | string | null;
}

export interface ScoreboardCardProps {
  player1: Player;
  player2: Player;
  player1Partner?: Player | null;
  player2Partner?: Player | null;
  scoreState?: ScoreboardScoreState | null;
  isSuspended?: boolean;
  format?: string;
}
