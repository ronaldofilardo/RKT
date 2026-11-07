'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Cores por atleta seguindo o card da partida (MatchCardScoreTable):
 * - vencedor da partida finalizada: volt (em claro, esmeralda);
 * - demais casos: branco canônico.
 *
 * Fornece também a classe de borda esquerda usada na timeline, que acompanha
 * o vencedor do ponto com a cor do respectivo atleta.
 */
export interface PlayerColors {
  p1: string;
  p2: string;
  p1Border: string;
  p2Border: string;
}

/** Mesma classe do vencedor no card (MatchCardScoreTable). */
export const MATCH_WINNER_TEXT = 'text-emerald-800 dark:text-telemetry-volt';

const NEUTRAL_TEXT = 'text-telemetry-text-primary';
const WINNER_BORDER = 'border-l-telemetry-volt';
const NEUTRAL_BORDER = 'border-l-white/10';

const DEFAULT_PLAYER_COLORS: PlayerColors = {
  p1: NEUTRAL_TEXT,
  p2: NEUTRAL_TEXT,
  p1Border: NEUTRAL_BORDER,
  p2Border: NEUTRAL_BORDER,
};

const PlayerColorContext = createContext<PlayerColors>(DEFAULT_PLAYER_COLORS);

export function PlayerColorProvider({ colors, children }: { colors: PlayerColors; children: ReactNode }) {
  return <PlayerColorContext.Provider value={colors}>{children}</PlayerColorContext.Provider>;
}

/** Retorna as cores do card; sem vencedor (partida em andamento) → ambos brancos. */
export function usePlayerColors(): PlayerColors {
  return useContext(PlayerColorContext);
}

interface PlayerColorSource {
  state?: string | null;
  winnerId?: string | null;
  player1: { id: string };
  player2: { id: string };
}

export function resolvePlayerColors(report: PlayerColorSource | null | undefined): PlayerColors {
  if (!report || report.state !== 'FINISHED' || !report.winnerId) return DEFAULT_PLAYER_COLORS;

  const p1Won = report.winnerId === report.player1.id;
  const p2Won = report.winnerId === report.player2.id;

  return {
    p1: p1Won ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
    p2: p2Won ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
    p1Border: p1Won ? WINNER_BORDER : NEUTRAL_BORDER,
    p2Border: p2Won ? WINNER_BORDER : NEUTRAL_BORDER,
  };
}