'use client';

import type { SuporteTab } from './types';

interface ModuleNavProps {
  module: SuporteTab;
  onModuleChange: (module: SuporteTab) => void;
}

/** @deprecated Use SuporteTabNav */
export function ModuleNav({ module, onModuleChange }: ModuleNavProps) {
  const modules: Array<{ key: SuporteTab; label: string }> = [
    { key: 'clubes', label: 'Clubes e CTs' },
    { key: 'gestores', label: 'Gestores' },
    { key: 'avulsos', label: 'Contas Avulsas' },
    { key: 'financeiro', label: 'Financeiro' },
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-telemetry-border/20 pb-2">
      {modules.map((m) => (
        <button
          key={m.key}
          onClick={() => onModuleChange(m.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            module === m.key
              ? 'border-telemetry-blue-light text-white font-semibold'
              : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
