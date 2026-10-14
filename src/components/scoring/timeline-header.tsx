'use client';

import { FilterBar } from './timeline-filters';
import type { FilterCounts } from './timeline-filters';
import type { FilterKey } from './timeline-types';

interface TimelineHeaderProps {
  activeFilters: Set<FilterKey>;
  onToggleFilter: (key: FilterKey) => void;
  onClearFilters: () => void;
  counts: FilterCounts;
  player1Name: string;
  player2Name: string;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
}

export function TimelineHeader({
  activeFilters,
  onToggleFilter,
  onClearFilters,
  counts,
  player1Name,
  player2Name,
  filteredCount,
  totalCount,
  hasActiveFilters,
}: TimelineHeaderProps) {
  return (
    <>
      <FilterBar
        activeFilters={activeFilters}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        counts={counts}
        playerNames={{ p1: player1Name, p2: player2Name }}
      />
      <p className="text-xs text-telemetry-text-muted mb-3">
        {hasActiveFilters ? `${filteredCount} de ${totalCount} pontos` : `${totalCount} pontos`}
      </p>
    </>
  );
}
