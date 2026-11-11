import React from 'react';

export type AthleteEditTab = 'pessoais' | 'tecnicos';

interface AthleteEditTabsProps {
  activeTab: AthleteEditTab;
  onTabChange: (tab: AthleteEditTab) => void;
}

export function AthleteEditTabs({ activeTab, onTabChange }: AthleteEditTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Abas de edição de atleta"
      className="flex border-b border-white/10 px-4 pt-1 bg-telemetry-elevated gap-4"
    >
      <button
        type="button"
        role="tab"
        id="tab-dados-pessoais"
        aria-controls="panel-dados-pessoais"
        aria-selected={activeTab === 'pessoais'}
        onClick={() => onTabChange('pessoais')}
        className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
          activeTab === 'pessoais'
            ? 'border-telemetry-volt text-telemetry-volt'
            : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
        }`}
      >
        1. Dados Pessoais
      </button>
      <button
        type="button"
        role="tab"
        id="tab-dados-tecnicos"
        aria-controls="panel-dados-tecnicos"
        aria-selected={activeTab === 'tecnicos'}
        onClick={() => onTabChange('tecnicos')}
        className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
          activeTab === 'tecnicos'
            ? 'border-telemetry-volt text-telemetry-volt'
            : 'border-transparent text-telemetry-text-muted hover:text-telemetry-text-primary'
        }`}
      >
        2. Dados Técnicos
      </button>
    </div>
  );
}

