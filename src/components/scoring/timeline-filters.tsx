import type { FilterKey } from './timeline-types';
import { Chip } from './timeline-filter-chip';

export interface FilterCounts {
  p1: number;
  p2: number;
  bp: number;
  winners?: number;
  errors?: number;
  ace?: number;
  winner?: number;
  forcedError?: number;
  unforcedError?: number;
  doubleFault?: number;
}

interface FilterBarProps {
  activeFilters: Set<FilterKey>;
  onToggleFilter: (key: FilterKey) => void;
  onClearFilters: () => void;
  counts: FilterCounts;
  playerNames: { p1: string; p2: string };
}

export function FilterBar({ activeFilters, onToggleFilter, onClearFilters, counts, playerNames }: FilterBarProps) {
  const hasActiveFilters = activeFilters.size > 0;
  const winnerCount = counts.winners ?? ((counts.ace ?? 0) + (counts.winner ?? 0));
  const errorCount = counts.errors ?? ((counts.forcedError ?? 0) + (counts.unforcedError ?? 0) + (counts.doubleFault ?? 0));

  return (
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtros da timeline">
      <Chip
        label={`P1 · ${playerNames.p1} (${counts.p1})`}
        active={activeFilters.has('p1')}
        color="blue"
        onClick={() => onToggleFilter('p1')}
      />
      <Chip
        label={`P2 · ${playerNames.p2} (${counts.p2})`}
        active={activeFilters.has('p2')}
        color="rose"
        onClick={() => onToggleFilter('p2')}
      />
      {counts.bp > 0 && (
        <Chip
          label={`Breakpoints (${counts.bp})`}
          active={activeFilters.has('bp')}
          color="gray"
          onClick={() => onToggleFilter('bp')}
        />
      )}
      <Chip
        label={`Winners / Aces (${winnerCount})`}
        active={activeFilters.has('winners')}
        color="gray"
        onClick={() => onToggleFilter('winners')}
      />
      <Chip
        label={`Erros (${errorCount})`}
        active={activeFilters.has('errors')}
        color="gray"
        onClick={() => onToggleFilter('errors')}
      />
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-1 text-xs font-semibold rounded-full border border-white/10 text-telemetry-text-muted hover:bg-white/10 transition-colors"
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}
