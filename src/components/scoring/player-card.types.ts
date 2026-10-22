export interface Player {
  id: string;
  name: string;
}

export interface GameScore {
  player1: number;
  player2: number;
  isDeuce: boolean;
  advantage: 'player1' | 'player2' | null;
}

export interface SetScore {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

export interface ScoreState {
  sets: SetScore[];
  currentGame: GameScore;
  server: 'player1' | 'player2';
  isFinished: boolean;
  winner: 'player1' | 'player2' | null;
  setsWon: { player1: number; player2: number };
}

export interface PlayerCardProps {
  player: Player;
  partner?: Player | null;
  side: 'player1' | 'player2';
  scoreState: ScoreState | null;
  isServing: boolean;
  activeServerId?: string | null;
  activeReceiverId?: string | null;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isWinner: boolean;
  onPoint: () => void;
  onSwipeDown: () => void;
  disabled?: boolean;
}
