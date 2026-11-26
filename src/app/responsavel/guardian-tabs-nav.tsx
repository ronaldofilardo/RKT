'use client';

export type GuardianTab = 'autorizacoes' | 'partidas' | 'avisos' | 'acessos' | 'ajuda';

interface GuardianTabsNavProps {
  currentTab: GuardianTab;
  onSelectTab: (tab: GuardianTab) => void;
  matchesCount?: number;
  avisosCount?: number;
}

export function GuardianTabsNav({
  currentTab,
  onSelectTab,
  matchesCount,
  avisosCount,
}: GuardianTabsNavProps) {
  const tabs: Array<{ key: GuardianTab; label: string; badge?: number }> = [
    { key: 'autorizacoes', label: '🛡️ Autorizações' },
    { key: 'partidas', label: '🎾 Partidas', badge: matchesCount },
    { key: 'avisos', label: '🔔 Avisos', badge: avisosCount },
    { key: 'acessos', label: '👤 Acessos' },
    { key: 'ajuda', label: '❓ Ajuda' },
  ];

  return (
    <div className="flex gap-2 border-b border-telemetry-border/20 pb-2 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelectTab(t.key)}
            className={`px-3 py-2 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              isActive
                ? 'border-telemetry-blue-light text-telemetry-text-primary font-bold'
                : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
            }`}
          >
            <span>{t.label}</span>
            {typeof t.badge === 'number' && t.badge > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-telemetry-blue/30 text-telemetry-blue-light border border-telemetry-blue-light/30'
                    : 'bg-telemetry-elevated text-telemetry-text-muted'
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
