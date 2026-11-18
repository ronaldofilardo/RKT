import type { MatchSubTab } from './club-matches-table';

interface SubTabsProps {
  subTab: MatchSubTab;
  onSubTabChange: (tab: MatchSubTab) => void;
  matchesCount: number;
  externalCount: number;
}

export function ClubMatchesSubTabs({
  subTab,
  onSubTabChange,
  matchesCount,
  externalCount,
}: SubTabsProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div
        role="tablist"
        aria-label="Origem das partidas"
        className="inline-flex p-1 bg-telemetry-elevated/70 border border-telemetry-border/30 rounded-xl gap-1"
      >
        <button
          type="button"
          role="tab"
          id="subtab-my-club"
          aria-selected={subTab === 'my_club'}
          aria-controls="subtab-panel-my-club"
          onClick={() => onSubTabChange('my_club')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'my_club'
              ? 'bg-telemetry-card text-white shadow-sm border border-telemetry-blue-light/40'
              : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          <span>Meu clube</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
              subTab === 'my_club'
                ? 'bg-telemetry-blue/30 text-telemetry-blue-light'
                : 'bg-white/5 text-telemetry-text-muted'
            }`}
          >
            {matchesCount}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id="subtab-others"
          aria-selected={subTab === 'others'}
          aria-controls="subtab-panel-others"
          onClick={() => onSubTabChange('others')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'others'
              ? 'bg-telemetry-card text-white shadow-sm border border-telemetry-blue-light/40'
              : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          <span>Outros</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
              externalCount > 0
                ? 'bg-telemetry-volt/20 text-telemetry-volt border border-telemetry-volt/30'
                : 'bg-white/5 text-telemetry-text-muted'
            }`}
          >
            {externalCount}
          </span>
        </button>
      </div>
    </div>
  );
}
