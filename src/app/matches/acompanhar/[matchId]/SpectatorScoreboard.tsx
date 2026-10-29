'use client';

import React, { useMemo } from 'react';
import type { SpectatorView } from '@/core/spectate';
import { ScoreboardCard } from '@/components/scoring/ScoreboardCard';
import { buildSpectatorScoreboardProps } from './spectator-scoreboard.logic';

/** Placar do acompanhamento: mesmo cartão do /scoring (Set 1/2/3, sacador, atual em destaque) + coluna do game. */
export function SpectatorScoreboard({
  view,
  isDimmed,
}: {
  view: SpectatorView;
  isDimmed?: boolean;
}) {
  const props = useMemo(() => buildSpectatorScoreboardProps(view), [view]);

  return (
    <div className={`transition-opacity ${isDimmed ? 'opacity-70' : 'opacity-100'}`}>
      {isDimmed && (
        <div className="flex justify-end mb-1">
          <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
            Último recebido
          </span>
        </div>
      )}
      <ScoreboardCard {...props} />
    </div>
  );
}
