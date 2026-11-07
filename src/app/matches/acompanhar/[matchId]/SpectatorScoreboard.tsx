'use client';

import React, { useMemo } from 'react';
import type { SpectatorView } from '@/core/spectate';
import type { ScoreboardScoreState } from '@/components/scoring/scoreboard-card.types';
import { buildSpectatorScoreboardProps } from './spectator-scoreboard.logic';

export function SpectatorScoreboard({
  view,
  isDimmed,
}: {
  view: SpectatorView;
  isDimmed?: boolean;
}) {
  const props = useMemo(() => buildSpectatorScoreboardProps(view), [view]);
  const { player1, player2, scoreState, gamePoints, displayNames } = props;
  const { sets, isFinished, winner, server } = scoreState as ScoreboardScoreState;
  const serverSide = server;

  const p1Sets = (sets ?? []).filter((s) => {
    const a = s.isTiebreak && s.tiebreakScore ? s.tiebreakScore.player1 : s.player1;
    const b = s.isTiebreak && s.tiebreakScore ? s.tiebreakScore.player2 : s.player2;
    return a > b;
  }).length;
  const p2Sets = (sets ?? []).filter((s) => {
    const a = s.isTiebreak && s.tiebreakScore ? s.tiebreakScore.player1 : s.player1;
    const b = s.isTiebreak && s.tiebreakScore ? s.tiebreakScore.player2 : s.player2;
    return b > a;
  }).length;

  const currentSet = (sets ?? [])[(sets ?? []).length - 1];
  const p1Current = currentSet?.isTiebreak && currentSet.tiebreakScore ? currentSet.tiebreakScore.player1 : currentSet?.player1 ?? 0;
  const p2Current = currentSet?.isTiebreak && currentSet.tiebreakScore ? currentSet.tiebreakScore.player2 : currentSet?.player2 ?? 0;

  const p1Score = isFinished ? p1Sets : p1Current;
  const p2Score = isFinished ? p2Sets : p2Current;

  const p1DisplayName = displayNames?.player1 ?? player1.name;
  const p2DisplayName = displayNames?.player2 ?? player2.name;

  return (
    <div className={`sticky top-0 z-20 bg-telemetry-card/95 backdrop-blur-sm py-2 transition-opacity ${isDimmed ? 'opacity-70' : 'opacity-100'}`}>
      {isDimmed && (
        <div className="flex justify-end mb-1">
          <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-telemetry-alert/20 text-telemetry-alert rounded border border-telemetry-alert/30">
            Último recebido
          </span>
        </div>
      )}
      <div className="border-b border-telemetry-border/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="font-mono text-sm text-telemetry-text-muted">{p1DisplayName}</p>
            <p className={`font-mono text-2xl font-bold tabular-nums ${isFinished && winner === 'player1' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}`}>
              {p1Score}
            </p>
          </div>

          <div className="text-center">
            <p className="font-mono text-sm text-telemetry-text-muted">
              {isFinished ? 'Final' : 'Atualizado há poucos segundos'}
            </p>
            <p className="font-mono text-lg text-telemetry-text-muted">–</p>
          </div>

          <div className="text-right">
            <p className="font-mono text-sm text-telemetry-volt">{p2DisplayName}</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-telemetry-volt">
              {p2Score}
            </p>
          </div>
        </div>

        {isFinished && winner && (
          <p className="mt-2 text-center font-mono text-xs text-telemetry-volt">
            {winner === 'player1' ? p1DisplayName : p2DisplayName} venceu
          </p>
        )}

        {!isFinished && gamePoints && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
              serverSide === 'player1' ? 'bg-telemetry-text-primary text-telemetry-base' : 'bg-telemetry-volt/20 text-telemetry-volt'
            }`}>
              {gamePoints.player1}
            </span>
            <span className="font-mono text-xs text-telemetry-text-muted">{gamePoints.title ?? 'Pts'}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
              serverSide === 'player2' ? 'bg-telemetry-volt text-telemetry-base' : 'bg-telemetry-volt/20 text-telemetry-volt'
            }`}>
              {gamePoints.player2}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}