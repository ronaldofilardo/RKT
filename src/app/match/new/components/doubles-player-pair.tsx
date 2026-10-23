'use client';

import type { Athlete } from '../types';
import { AthleteDropdown } from './AthleteDropdown';

interface PairSlotProps {
  label: string;
  selected: Athlete | null;
  isOpen: boolean;
  excluded: (Athlete | null)[];
  onToggle?: () => void;
  onSelect?: (a: Athlete | null) => void;
  onCreateNew?: () => void;
}

export interface DoublesPlayerPairProps {
  accent: 'sky' | 'emerald';
  title: string;
  athletes: Athlete[];
  primary: PairSlotProps;
  partner: PairSlotProps;
}

const ACCENTS = {
  sky: {
    card: 'border-sky-500/20',
    header: 'border-sky-500/10',
    dot: 'bg-sky-400',
    text: 'text-sky-400',
  },
  emerald: {
    card: 'border-emerald-500/20',
    header: 'border-emerald-500/10',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
} as const;

export function DoublesPlayerPair({
  accent,
  title,
  athletes,
  primary,
  partner,
}: DoublesPlayerPairProps) {
  const style = ACCENTS[accent];

  const slot = (s: PairSlotProps) => (
    <AthleteDropdown
      label={s.label}
      athletes={athletes}
      selectedAthlete={s.selected}
      excludedAthletes={s.excluded}
      isOpen={s.isOpen}
      colorClass={accent}
      onToggle={s.onToggle ?? (() => {})}
      onSelect={s.onSelect ?? (() => {})}
      onCreateNew={s.onCreateNew ?? (() => {})}
    />
  );

  return (
    <div className={`bg-telemetry-elevated/40 rounded-xl ${style.card} p-3 space-y-3`}>
      <div className={`flex items-center gap-2 ${style.header} border-b pb-2`}>
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className={`text-xs font-bold ${style.text} uppercase tracking-wider`}>
          {title}
        </span>
      </div>
      {slot(primary)}
      {slot(partner)}
    </div>
  );
}
