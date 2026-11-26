'use client';

import React, { useState } from 'react';
import type { BillingAccountState, PlanTier, BillingCycle } from '@/types/billing';
import { PlansSelectionView } from './plans-selection-view';
import { getPlansForTarget } from '@/core/billing/billing-plans';

interface PaywallModalProps {
  isOpen: boolean;
  billing: BillingAccountState | null;
  onClose: () => void;
  onSubscribe: (planId: PlanTier, cycle: BillingCycle) => void;
}

export function PaywallModal({
  isOpen,
  billing,
  onClose,
  onSubscribe,
}: PaywallModalProps) {
  const defaultTarget = billing?.target ?? 'ATLETA_INDEPENDENTE';
  const availablePlans = getPlansForTarget(defaultTarget);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>(
    availablePlans[0]?.id ?? 'ATLETA_PRO',
  );
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');

  if (!isOpen || !billing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-telemetry-surface border border-telemetry-border rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between border-b border-telemetry-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-telemetry-text-primary">
              Modo Consulta: Degustação Finalizada
            </h2>
            <p className="text-xs text-telemetry-text-secondary mt-0.5">
              Seu histórico e estatísticas estão seguros. Para criar novas partidas e gerenciar
              atletas, escolha o seu plano abaixo:
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="text-telemetry-text-secondary hover:text-telemetry-text-primary text-sm p-1"
          >
            ✕
          </button>
        </div>

        <PlansSelectionView
          target={billing.target}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          cycle={cycle}
          onCycleChange={setCycle}
        />

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-telemetry-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded text-xs font-medium border border-telemetry-border text-telemetry-text-secondary hover:text-telemetry-text-primary hover:bg-telemetry-base transition-colors"
          >
            Continuar no Modo Consulta
          </button>
          <button
            type="button"
            onClick={() => onSubscribe(selectedPlanId, cycle)}
            className="w-full sm:w-auto px-4 py-2 rounded text-xs font-medium bg-telemetry-blue hover:bg-telemetry-blue/80 text-white transition-colors"
          >
            Assinar e Desbloquear
          </button>
        </div>
      </div>
    </div>
  );
}
