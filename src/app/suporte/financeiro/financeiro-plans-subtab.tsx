'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { PlanDefinition } from '@/types/billing';
import { PlanEditModal } from './plan-edit-modal';

export function FinanceiroPlansSubtab() {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanDefinition | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPlans = useCallback(() => {
    setLoading(true);
    fetch('/api/suporte/financeiro/plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setPlans(d?.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-semibold text-telemetry-text-primary uppercase tracking-wide">Catálogo de Planos</h4>
          <p className="text-xs text-telemetry-text-muted">Parametrize preços, cotas e benefícios de cada plano.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingPlan(null); setModalOpen(true); }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-telemetry-blue hover:bg-telemetry-blue-light text-white"
        >
          + Novo Plano
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-telemetry-text-muted">Carregando catálogo de planos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-telemetry-text-primary">{p.name}</h5>
                    <span className="text-[10px] font-mono text-telemetry-text-muted">{p.id}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded font-semibold bg-telemetry-elevated text-telemetry-volt">
                    {p.target === 'ATLETA_INDEPENDENTE' ? 'Atleta' : p.target === 'TREINADOR_PARTICULAR' ? 'Treinador' : 'CT'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-extrabold text-telemetry-text-primary">R$ {p.monthlyPrice.toFixed(2)}</span>
                  <span className="text-xs text-telemetry-text-muted">/mês</span>
                  <span className="text-[11px] text-telemetry-text-muted ml-auto">(R$ {p.yearlyPrice.toFixed(2)}/ano)</span>
                </div>
                <p className="text-xs text-telemetry-text-muted line-clamp-2">{p.tooltip}</p>
                <div className="text-[11px] space-y-1 pt-2 border-t border-telemetry-border/10 text-telemetry-text-muted">
                  <div>Cota atletas: <strong className="text-telemetry-text-primary">{p.quotaAthletes ?? 'Ilimitado'}</strong></div>
                  <div>Cota treinadores: <strong className="text-telemetry-text-primary">{p.quotaCoaches ?? 0}</strong></div>
                  {p.extraAthletePrice && <div>Atleta extra: <strong className="text-telemetry-text-primary">+R$ {p.extraAthletePrice.toFixed(2)}</strong></div>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEditingPlan(p); setModalOpen(true); }}
                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-telemetry-elevated hover:bg-telemetry-active text-telemetry-text-primary border border-telemetry-border/20"
              >
                Editar Plano
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <PlanEditModal
          open={modalOpen}
          plan={editingPlan}
          onClose={() => setModalOpen(false)}
          onSaved={loadPlans}
        />
      )}
    </div>
  );
}
