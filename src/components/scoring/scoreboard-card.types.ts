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
  /** Nomes já abreviados (sobrepõem a abreviação automática). Usado no acompanhamento. */
  displayNames?: { player1?: string; player2?: string };
  /** Coluna extra com o placar do game em andamento (15, 30, 40, AD). */
  gamePoints?: { player1: string; player2: string; title?: string } | null;
  /** Substitui as margens/largura padrão do cartão (padrão: "mx-4 sm:mx-auto max-w-md"). */
  className?: string;
}
