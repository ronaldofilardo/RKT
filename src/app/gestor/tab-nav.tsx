'use client';

import type { GestorTab } from './types';

interface TabNavProps {
  tab: GestorTab;
  onTabChange: (tab: GestorTab) => void;
  matchesCount?: number;
  coachesCount?: number;
  athletesCount?: number;
  affiliatesCount?: number;
}

export function TabNav({
  tab,
  onTabChange,
  matchesCount,
  coachesCount,
  athletesCount,
  affiliatesCount,
}: TabNavProps) {
  const tabs: Array<{ key: GestorTab; label: string; badge?: number }> = [
    { key: 'coaches', label: 'Treinadores', badge: coachesCount },
    { key: 'athletes', label: 'Atletas', badge: athletesCount },
    { key: 'affiliates', label: 'Afiliados', badge: affiliatesCount },
    { key: 'matches', label: 'Partidas', badge: matchesCount },
    { key: 'club', label: 'Clube' },
  ];

  return (
    <div className="flex gap-2 mb-4 border-b border-telemetry-border/20 pb-2 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            tab === t.key
              ? 'border-telemetry-blue text-telemetry-blue font-semibold'
              : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          {t.label}
          {typeof t.badge === 'number' && t.badge >= 0 && (
            <span className="bg-telemetry-blue/20 text-telemetry-blue text-xs px-1.5 py-0.5 rounded-full font-bold">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
