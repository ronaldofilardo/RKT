/**
 * Tipos do módulo de insights táticos ao vivo
 * (contadores de partida e insights gerados).
 */

export interface LiveMatchCounters {
  aces: { p1: number; p2: number };
  doubleFaults: { p1: number; p2: number };
  breakPoints: {
    p1: { converted: number; total: number; pct: number };
    p2: { converted: number; total: number; pct: number };
  };
  breakPointsSaved: {
    p1: { saved: number; total: number; pct: number };
    p2: { saved: number; total: number; pct: number };
  };
  forcedErrors: { p1: number; p2: number };
  unforcedErrors: { p1: number; p2: number };
  totalPointsWon: { p1: number; p2: number };
}

export interface TacticalInsight {
  id: string;
  type: 'weakness' | 'trend' | 'opportunity' | 'alert';
  title: string;
  message: string;
  playerSide: 'player1' | 'player2';
  icon: string;
}
