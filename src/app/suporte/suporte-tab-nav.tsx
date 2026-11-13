'use client';

import type { SuporteModule } from './types';

interface SuporteTabNavProps {
  module: SuporteModule;
  onModuleChange: (module: SuporteModule) => void;
}

export function SuporteTabNav({ module, onModuleChange }: SuporteTabNavProps) {
  const tabs: Array<{ key: SuporteModule; label: string }> = [
    { key: 'clubes', label: 'Clubes e CTs' },
    { key: 'gestores', label: 'Gestores' },
    { key: 'avulsos', label: 'Contas Avulsas' },
  ];

  return (
    <div className="flex gap-2 mb-4 border-b border-telemetry-border/20 pb-2 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onModuleChange(t.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            module === t.key
              ? 'border-telemetry-blue text-telemetry-blue font-semibold'
              : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
