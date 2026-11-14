'use client';

import { ScoreboardCard } from './ScoreboardCard';
import { LiveCountersBar } from './LiveCountersBar';
import { getFormatLabel } from '@/core/scoring/format-labels';
import type { ScoringState } from '@/core/scoring/types';
import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';

interface ScoringHeaderProps {
  match: {
    player1: { id: string; name: string };
    player2: { id: string; name: string };
    player1Partner?: { id: string; name: string } | null;
    player2Partner?: { id: string; name: string } | null;
    format: string;
    tournamentName?: string | null;
    category?: string | null;
    round?: number | null;
  };
  effectiveScoreState: ScoringState | null;
  isSuspended: boolean;
  liveCounters: LiveMatchCounters;
  completedSetsCount: number;
  p1IsServing: boolean;
  p2IsServing: boolean;
  onOpenSetSummary: () => void;
}

export function ScoringHeader({
  match,
  effectiveScoreState,
  isSuspended,
  liveCounters,
  completedSetsCount,
  p1IsServing,
  p2IsServing,
  onOpenSetSummary,
}: ScoringHeaderProps) {
  const formatLabel = getFormatLabel(match.format);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-2 lg:gap-4 items-start flex-shrink-0">
      {/* Placar - Esquerda */}
      <div className="lg:max-w-md">
        <ScoreboardCard
          player1={match.player1}
          player2={match.player2}
          player1Partner={match.player1Partner ?? undefined}
          player2Partner={match.player2Partner ?? undefined}
          scoreState={effectiveScoreState}
          isSuspended={isSuspended}
          format={match.format}
        />
      </div>

      {/* Formato/Torneio/Fase - Centro */}
      <div className="flex flex-col items-center justify-center gap-0.5 text-center px-2">
        <p className="text-[clamp(11px,1.5dvh,13px)] font-semibold text-white/90 tracking-tight">
          {formatLabel}
        </p>
        {match.tournamentName && (
          <p className="text-[clamp(10px,1.3dvh,12px)] text-white/70">
            {match.tournamentName}
          </p>
        )}
        {match.round && (
          <p className="text-[clamp(9px,1.2dvh,11px)] text-white/60">
            Rodada {match.round}
          </p>
        )}
      </div>

      {/* Estatísticas ao Vivo - Direita */}
      <div className="lg:max-w-md">
        <LiveCountersBar
          counters={liveCounters}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          completedSetsCount={completedSetsCount}
          onOpenSetSummary={onOpenSetSummary}
          p1IsServing={p1IsServing}
          p2IsServing={p2IsServing}
        />
      </div>
    </div>
  );
}
