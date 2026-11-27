'use client';

import React from 'react';
import type { FinanceiroSubtab } from './financeiro-types';

interface FinanceiroSubtabNavProps {
  currentTab: FinanceiroSubtab;
  onTabChange: (tab: FinanceiroSubtab) => void;
}

const SUBTABS: Array<{ id: FinanceiroSubtab; label: string }> = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'usuarios', label: 'Assinaturas & Usuários' },
  { id: 'cobrancas', label: 'Cobranças' },
  { id: 'planos', label: 'Planos' },
];

export function FinanceiroSubtabNav({ currentTab, onTabChange }: FinanceiroSubtabNavProps) {
  return (
    <div className="flex border-b border-telemetry-border/10 gap-2 mb-6 overflow-x-auto pb-1">
      {SUBTABS.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-telemetry-elevated text-telemetry-text-primary border border-telemetry-border/20 shadow-sm'
                : 'text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-card/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
