'use client';

import type { GestorTab } from './types';

interface TabNavProps {
  tab: GestorTab;
  onTabChange: (tab: GestorTab) => void;
  matchesCount?: number;
  coachesCount?: number;
  athletesCount?: number;
  affiliatesCount?: number;
  solicitacoesCount?: number;
}

export function TabNav({
  tab,
  onTabChange,
  matchesCount,
  coachesCount,
  athletesCount,
  affiliatesCount,
  solicitacoesCount,
}: TabNavProps) {
  const tabs: Array<{ key: GestorTab; label: string; badge?: number }> = [
    { key: 'coaches', label: 'Treinadores', badge: coachesCount },
    { key: 'athletes', label: 'Atletas', badge: athletesCount },
    { key: 'affiliates', label: 'Afiliados', badge: affiliatesCount },
    { key: 'matches', label: 'Partidas', badge: matchesCount },
    { key: 'club', label: 'Clube' },
    { key: 'help', label: 'Ajuda' },
  ];

  if (typeof solicitacoesCount === 'number' && solicitacoesCount > 0) {
    tabs.splice(2, 0, { key: 'solicitacoes', label: 'Solicitações', badge: solicitacoesCount });
  }

  return (
    <div className="flex gap-2 mb-4 border-b border-telemetry-border/20 pb-2 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              isActive
                ? 'border-telemetry-blue-light text-white font-semibold'
                : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
            }`}
          >
            {t.label}
            {typeof t.badge === 'number' && t.badge >= 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-telemetry-blue/40 text-telemetry-blue-light border border-telemetry-blue-light/30'
                    : 'bg-telemetry-border/10 text-telemetry-text-muted'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
