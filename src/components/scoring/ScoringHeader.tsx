'use client';

import { ScoreboardCard } from './ScoreboardCard';
import { LiveCountersBar, hasAnyLiveCounters } from './LiveCountersBar';
import { ScoringHeaderMeta } from './scoring-header-meta';
import { getFormatLabel } from '@/core/scoring/format-labels';
import type { ScoringState } from '@/core/scoring/types';
import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';

interface ScoringHeaderProps {
  match: {
    player1: { id: string; name: string; club?: string | null; state?: string | null };
    player2: { id: string; name: string; club?: string | null; state?: string | null };
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
  const showLiveCounters = hasAnyLiveCounters(liveCounters);

  const scoreboard = (
    <ScoreboardCard
      player1={match.player1}
      player2={match.player2}
      player1Partner={match.player1Partner ?? undefined}
      player2Partner={match.player2Partner ?? undefined}
      scoreState={effectiveScoreState}
      isSuspended={isSuspended}
      format={match.format}
    />
  );

  return (
    <div className="flex flex-col gap-1 items-stretch flex-shrink-0">
      {showLiveCounters ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-1.5 sm:gap-2.5 items-stretch justify-center max-w-3xl mx-auto w-full">
          <div className="min-w-0">{scoreboard}</div>
          <div className="min-w-0">
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
      ) : (
        <div className="max-w-md mx-auto w-full">{scoreboard}</div>
      )}

      <ScoringHeaderMeta
        formatLabel={formatLabel}
        tournamentName={match.tournamentName}
        round={match.round}
      />
    </div>
  );
}
