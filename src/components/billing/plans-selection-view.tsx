'use client';

import React from 'react';
import type { PlanDefinition, BillingTarget, PlanTier, BillingCycle } from '@/types/billing';
import { BILLING_PLANS, getPlansForTarget } from '@/core/billing/billing-plans';
import { PlanCardItem } from './plan-card-item';

interface PlansSelectionViewProps {
  target: BillingTarget | null;
  selectedPlanId: PlanTier | null;
  onSelectPlan: (id: PlanTier) => void;
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

export function PlansSelectionView({
  target,
  selectedPlanId,
  onSelectPlan,
  cycle,
  onCycleChange,
}: PlansSelectionViewProps) {
  const plans: PlanDefinition[] = target ? getPlansForTarget(target) : BILLING_PLANS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 py-1">
        <button
          type="button"
          onClick={() => onCycleChange('MONTHLY')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            cycle === 'MONTHLY'
              ? 'bg-telemetry-blue text-white'
              : 'text-telemetry-text-secondary hover:text-telemetry-text-primary'
          }`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => onCycleChange('YEARLY')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
            cycle === 'YEARLY'
              ? 'bg-telemetry-blue text-white'
              : 'text-telemetry-text-secondary hover:text-telemetry-text-primary'
          }`}
        >
          <span>Anual</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-telemetry-volt/20 text-telemetry-volt font-semibold">
            Pague 10, leve 12
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {plans.map((plan) => (
          <PlanCardItem
            key={plan.id}
            plan={plan}
            cycle={cycle}
            isSelected={selectedPlanId === plan.id}
            onSelect={onSelectPlan}
          />
        ))}
      </div>
    </div>
  );
}
