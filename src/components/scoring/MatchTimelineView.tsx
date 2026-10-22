'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { TimelineTable } from './timeline-table';
import { MatchInfoLine } from './timeline-match-info';
import { TimelineComments } from './timeline-comments';
import { TimelineLegend } from './timeline-legend';
import { TimelineHeader } from './timeline-header';
import { useTimelineFilters } from './use-timeline-filters';

import type { TimelineDoublesConfig } from './timeline-row.logic';

// Re-exports de compatibilidade (domínio movido para módulos vizinhos).
export { getSetResults, computeSetResultsFromPoints, extractSetsFromScoreState } from './timeline-set-results';
export type { SetResult } from './timeline-set-results';
export type { MatchInfoData } from './timeline-match-info';

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  matchId: string;
  hideFilters?: boolean;
  showFinalResult?: boolean;
  scoreState?: unknown;
  doubles?: TimelineDoublesConfig;
  matchInfo?: import('./timeline-match-info').MatchInfoData | null;
  comments?: Array<{
    id: string;
    content: string;
    category?: string | null;
    authorName: string;
    createdAt: string;
    hasAudioNote?: boolean;
    audioNoteDuration?: number | null;
  }>;
}

export function MatchTimelineView({
  points,
  player1Name,
  player2Name,
  matchId,
  hideFilters,
  showFinalResult,
  scoreState,
  doubles,
  matchInfo,
  comments = [],
}: MatchTimelineViewProps) {
  const {
    activeFilters,
    toggleFilter,
    clearFilters,
    hasActiveFilters,
    filteredPoints,
    groupedBySet,
    counts,
  } = useTimelineFilters(points);

  if (points.length === 0) {
    return (
      <div className="text-center py-12 text-telemetry-text-muted text-sm">
        Esta sessão não possui pontos detalhados registrados.
      </div>
    );
  }

  return (
    <div>
      {!hideFilters && (
        <TimelineHeader
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          counts={counts}
          player1Name={player1Name}
          player2Name={player2Name}
          filteredCount={filteredPoints.length}
          totalCount={points.length}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <TimelineTable
        groupedBySet={groupedBySet}
        points={points}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredPoints.length}
        matchId={matchId}
        player1Name={player1Name}
        player2Name={player2Name}
        showFinalResult={showFinalResult}
        scoreState={scoreState}
        doubles={doubles}
      />

      {matchInfo && <MatchInfoLine info={matchInfo} />}

      <TimelineComments comments={comments} matchId={matchId} />

      <TimelineLegend
        player1Name={doubles?.player1PartnerName ? `${player1Name}/${doubles.player1PartnerName}` : player1Name}
        player2Name={doubles?.player2PartnerName ? `${player2Name}/${doubles.player2PartnerName}` : player2Name}
      />
    </div>
  );
}
