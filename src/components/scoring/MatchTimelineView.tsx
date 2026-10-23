'use client';

import { TimelineTable } from './timeline-table';
import { MatchInfoLine } from './timeline-match-info';
import { TimelineComments } from './timeline-comments';
import { TimelineLegend } from './timeline-legend';
import { TimelineHeader } from './timeline-header';
import { useTimelineFilters } from './use-timeline-filters';

// Re-exports de compatibilidade (domínio movido para módulos vizinhos).
export { getSetResults, computeSetResultsFromPoints, extractSetsFromScoreState } from './timeline-set-results';
export type { SetResult } from './timeline-set-results';
export type { MatchInfoData } from './timeline-match-info';

import type { MatchTimelineViewProps } from './match-timeline-view.types';

export type { MatchTimelineViewProps } from './match-timeline-view.types';

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
