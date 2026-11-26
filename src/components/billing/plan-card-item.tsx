'use client';

import React, { useState } from 'react';
import type { PlanDefinition, BillingCycle } from '@/types/billing';

interface PlanCardItemProps {
  plan: PlanDefinition;
  cycle: BillingCycle;
  isSelected: boolean;
  onSelect: (planId: PlanDefinition['id']) => void;
}

export function PlanCardItem({ plan, cycle, isSelected, onSelect }: PlanCardItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const price = cycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
  const periodLabel = cycle === 'MONTHLY' ? '/mês' : '/ano (pague 10, leve 12)';

  return (
    <label
      className={`relative p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-telemetry-blue bg-telemetry-blue/10 ring-1 ring-telemetry-blue'
          : 'border-telemetry-border bg-telemetry-surface hover:border-telemetry-text-secondary/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <input
          type="radio"
          name="selectedPlan"
          checked={isSelected}
          onChange={() => onSelect(plan.id)}
          className="text-telemetry-blue focus:ring-telemetry-blue"
        />
        <span className="font-medium text-sm text-telemetry-text-primary">{plan.name}</span>
        <div className="relative ml-auto">
          <button
            type="button"
            aria-label={`Detalhes do plano ${plan.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip((prev) => !prev);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-telemetry-base text-telemetry-text-secondary hover:text-telemetry-volt border border-telemetry-border"
          >
            i
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-6 z-50 w-56 p-2 rounded bg-telemetry-base border border-telemetry-border shadow-xl text-xs text-telemetry-text-secondary">
              <p className="font-semibold text-telemetry-text-primary mb-1">Franquia do Plano:</p>
              <p>{plan.tooltip}</p>
            </div>
          )}
        </div>
      </div>
      <div className="text-lg font-bold text-telemetry-text-primary mb-2">
        R$ {price.toFixed(2).replace('.', ',')}
        <span className="text-xs font-normal text-telemetry-text-secondary ml-1">{periodLabel}</span>
      </div>
      <ul className="space-y-1">
        {plan.features.map((feat) => (
          <li key={feat.title} className="text-xs text-telemetry-text-secondary flex items-center gap-1.5">
            <span className="text-telemetry-blue">✓</span> {feat.title}
          </li>
        ))}
      </ul>
    </label>
  );
}
