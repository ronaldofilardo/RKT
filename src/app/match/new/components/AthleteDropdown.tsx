'use client';

import type { Athlete } from '../types';
import { AthleteDropdownPanel } from './athlete-dropdown-panel';

interface AthleteDropdownProps {
  label: string;
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  excludedAthlete?: Athlete | null;
  excludedAthletes?: (Athlete | null)[];
  isOpen: boolean;
  colorClass: 'sky' | 'emerald';
  onToggle: () => void;
  onSelect: (athlete: Athlete | null) => void;
  onCreateNew: () => void;
}

export function AthleteDropdown({
  label,
  athletes,
  selectedAthlete,
  excludedAthlete,
  excludedAthletes,
  isOpen,
  colorClass,
  onToggle,
  onSelect,
  onCreateNew,
}: AthleteDropdownProps) {
  const excludedSet = new Set(
    (excludedAthletes ?? (excludedAthlete ? [excludedAthlete] : []))
      .map((a) => a?.id)
      .filter(Boolean) as string[]
  );
  const filtered = athletes.filter((a) => !excludedSet.has(a.id));

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-telemetry-text-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-3 border border-white/10 rounded-lg text-left flex items-center justify-between bg-telemetry-elevated hover:border-white/20 text-telemetry-text-primary`}
      >
        <span className={selectedAthlete ? 'text-telemetry-text-primary font-medium' : 'text-telemetry-text-muted/50'}>
          {selectedAthlete?.name || 'Selecione...'}
        </span>
        <span className="text-telemetry-text-muted text-sm">▼</span>
      </button>
      {isOpen && (
        <AthleteDropdownPanel
          colorClass={colorClass}
          filtered={filtered}
          selectedAthlete={selectedAthlete}
          onSelect={onSelect}
          onCreateNew={onCreateNew}
        />
      )}
    </div>
  );
}
