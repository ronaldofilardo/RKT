'use client';

interface EditScoreServerPairProps {
  name: string;
  isActive: boolean;
  onSelect: () => void;
  accentColor: 'sky' | 'emerald';
}

export function EditScoreServerPair({ name, isActive, onSelect, accentColor }: EditScoreServerPairProps) {
  const activeClass = accentColor === 'sky'
    ? 'bg-telemetry-blue text-white ring-2 ring-telemetry-volt'
    : 'bg-emerald-600 text-white ring-2 ring-telemetry-volt';
  const inactiveClass = 'bg-telemetry-card text-telemetry-text-muted hover:text-white';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold text-left transition-all ${isActive ? activeClass : inactiveClass}`}
    >
      {name}
    </button>
  );
}