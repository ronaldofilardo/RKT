'use client';

import type { RefObject } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { PlayerGamesColumn } from './edit-score-game-column';

interface EditScoreGamesGridProps {
  matchFormat: TennisFormat;
  currentServer: 'player1' | 'player2';
  playerNames: { p1: string; p2: string };
  p1Input: string;
  p2Input: string;
  p1Val: number;
  p2Val: number;
  floorCurrentSets: { player1: number; player2: number } | null;
  isMatchTiebreakSet: boolean;
  p1InputRef?: RefObject<HTMLInputElement>;
  onP1InputChange: (value: string) => void;
  onP2InputChange: (value: string) => void;
}

/** Grade de games (P1 × P2) com marcador de saque e borda de liderança. */
export function EditScoreGamesGrid({
  matchFormat,
  currentServer,
  playerNames,
  p1Input,
  p2Input,
  p1Val,
  p2Val,
  floorCurrentSets,
  isMatchTiebreakSet,
  p1InputRef,
  onP1InputChange,
  onP2InputChange,
}: EditScoreGamesGridProps) {
  const maxGames = isMatchTiebreakSet ? 30 : matchFormat === 'PRO_SET_8' ? 10 : 7;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
      <PlayerGamesColumn
        name={playerNames.p1}
        value={p1Input}
        isServing={currentServer === 'player1'}
        isLeading={Boolean(p1Input && p2Input && p1Val > p2Val)}
        serverDotFirst
        min={floorCurrentSets?.player1 ?? 0}
        max={maxGames}
        inputRef={p1InputRef}
        onChange={onP1InputChange}
      />

      <span className="text-telemetry-text-muted text-sm font-space-grotesk opacity-40 self-end mb-2.5">×</span>

      <PlayerGamesColumn
        name={playerNames.p2}
        value={p2Input}
        isServing={currentServer === 'player2'}
        isLeading={Boolean(p1Input && p2Input && p2Val > p1Val)}
        serverDotFirst={false}
        min={floorCurrentSets?.player2 ?? 0}
        max={maxGames}
        onChange={onP2InputChange}
      />
    </div>
  );
}
