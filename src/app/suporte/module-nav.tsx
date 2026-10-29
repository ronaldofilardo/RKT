'use client';

import type { SuporteModule } from './types';

interface ModuleNavProps {
  module: SuporteModule;
  onModuleChange: (module: SuporteModule) => void;
}

export function ModuleNav({ module, onModuleChange }: ModuleNavProps) {
  const modules: Array<{ key: SuporteModule; label: string }> = [
    { key: 'clubes', label: 'Clubes e CTs' },
    { key: 'gestores', label: 'Gestores' },
    { key: 'avulsos', label: 'Contas Avulsas' },
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-telemetry-border/20 pb-2">
      {modules.map((m) => (
        <button
          key={m.key}
          onClick={() => onModuleChange(m.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            module === m.key
              ? 'border-telemetry-blue text-telemetry-blue font-semibold'
              : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
