import type { FilterKey } from './timeline-types';

interface ChipProps {
  label: string;
  active: boolean;
  color: 'blue' | 'rose' | 'gray';
  onClick: () => void;
}

const COLOR_MAP = {
  blue: {
    active: 'bg-blue-100 text-blue-700 border-blue-300',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  rose: {
    active: 'bg-rose-100 text-rose-700 border-rose-300',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  gray: {
    active: 'bg-gray-200 text-gray-800 border-gray-400',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  },
} as const;

export function Chip({ label, active, color, onClick }: ChipProps) {
  const colors = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
        active ? colors.active : colors.inactive
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

interface FilterBarProps {
  activeFilters: Set<FilterKey>;
  onToggleFilter: (key: FilterKey) => void;
  onClearFilters: () => void;
  counts: {
    p1: number;
    p2: number;
    bp: number;
    winners: number;
    errors: number;
  };
  playerNames: { p1: string; p2: string };
}

export function FilterBar({ activeFilters, onToggleFilter, onClearFilters, counts, playerNames }: FilterBarProps) {
  const hasActiveFilters = activeFilters.size > 0;

  return (
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtros da timeline">
      <Chip
        label={`${playerNames.p1} (${counts.p1})`}
        active={activeFilters.has('p1')}
        color="blue"
        onClick={() => onToggleFilter('p1')}
      />
      <Chip
        label={`${playerNames.p2} (${counts.p2})`}
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
        label={`Winners / Aces (${counts.winners})`}
        active={activeFilters.has('winners')}
        color="gray"
        onClick={() => onToggleFilter('winners')}
      />
      <Chip
        label={`Erros (${counts.errors})`}
        active={activeFilters.has('errors')}
        color="gray"
        onClick={() => onToggleFilter('errors')}
      />
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}