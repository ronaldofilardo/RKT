'use client';

interface MatchTypeToggleProps {
  isDoubles: boolean;
  onMatchTypeChange?: (type: 'SINGLES' | 'DOUBLES') => void;
}

export function MatchTypeToggle({ isDoubles, onMatchTypeChange }: MatchTypeToggleProps) {
  if (!onMatchTypeChange) return null;

  const baseClass = 'px-4 py-1.5 text-xs font-semibold rounded-md transition-all';
  const activeClass = 'bg-telemetry-blue text-white shadow-sm';
  const inactiveClass = 'text-telemetry-text-muted hover:text-telemetry-text-primary';

  return (
    <div className="inline-flex rounded-lg bg-telemetry-elevated p-1 border border-white/10 self-start sm:self-auto">
      <button
        type="button"
        onClick={() => onMatchTypeChange('SINGLES')}
        className={`${baseClass} ${!isDoubles ? activeClass : inactiveClass}`}
      >
        Simples
      </button>
      <button
        type="button"
        onClick={() => onMatchTypeChange('DOUBLES')}
        className={`${baseClass} ${isDoubles ? activeClass : inactiveClass}`}
      >
        Duplas
      </button>
    </div>
  );
}
