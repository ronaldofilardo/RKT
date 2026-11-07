'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  DEFAULT_PLAYER_COLORS,
  type PlayerColors,
  type PlayerColorSource,
  resolvePlayerColors,
  MATCH_WINNER_TEXT,
  NEUTRAL_TEXT,
  WINNER_BORDER,
  NEUTRAL_BORDER,
} from './player-color.logic';

export {
  DEFAULT_PLAYER_COLORS,
  type PlayerColors,
  type PlayerColorSource,
  resolvePlayerColors,
  MATCH_WINNER_TEXT,
  NEUTRAL_TEXT,
  WINNER_BORDER,
  NEUTRAL_BORDER,
};

const PlayerColorContext = createContext<PlayerColors>(DEFAULT_PLAYER_COLORS);

export function PlayerColorProvider({ colors, children }: { colors: PlayerColors; children: ReactNode }) {
  return <PlayerColorContext.Provider value={colors}>{children}</PlayerColorContext.Provider>;
}

export function usePlayerColors(): PlayerColors {
  return useContext(PlayerColorContext);
}
