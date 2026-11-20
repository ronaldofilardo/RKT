'use client';

import type { SuporteTab } from './types';

interface SuporteTabNavProps {
  tab: SuporteTab;
  onTabChange: (tab: SuporteTab) => void;
}

export function SuporteTabNav({ tab, onTabChange }: SuporteTabNavProps) {
  const tabs: Array<{ key: SuporteTab; label: string }> = [
    { key: 'clubes', label: 'Clubes e CTs' },
    { key: 'gestores', label: 'Gestores' },
    { key: 'avulsos', label: 'Contas Avulsas' },
    { key: 'financeiro', label: 'Financeiro' },
  ];

  return (
    <div className="flex gap-2 mb-4 border-b border-telemetry-border/20 pb-2 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            tab === t.key
              ? 'border-telemetry-blue-light text-white font-semibold'
              : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
