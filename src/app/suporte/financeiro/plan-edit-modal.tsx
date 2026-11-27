'use client';

import React from 'react';
import type { PlanDefinition, BillingTarget } from '@/types/billing';
import { usePlanEditForm } from './use-plan-edit-form';

interface PlanEditModalProps {
  open: boolean;
  plan: PlanDefinition | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PlanEditModal({ open, plan, onClose, onSaved }: PlanEditModalProps) {
  const form = usePlanEditForm(plan, onSaved, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-6 w-full max-w-lg space-y-4">
        <h3 className="text-base font-bold text-telemetry-text-primary">{form.isNew ? 'Novo Plano' : `Editar ${plan?.name}`}</h3>
        {form.error && <div className="p-2 bg-telemetry-error/20 text-telemetry-error text-xs rounded">{form.error}</div>}
        <form onSubmit={form.handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-telemetry-text-muted block mb-1">Código do Tier</label>
              <input disabled={!form.isNew} value={form.tierCode} onChange={(e) => form.setTierCode(e.target.value)} required className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2.5 py-1.5 text-telemetry-text-primary uppercase" />
            </div>
            <div>
              <label className="text-telemetry-text-muted block mb-1">Nome Comercial</label>
              <input value={form.name} onChange={(e) => form.setName(e.target.value)} required className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2.5 py-1.5 text-telemetry-text-primary" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-telemetry-text-muted block mb-1">Público</label>
              <select value={form.target} onChange={(e) => form.setTarget(e.target.value as BillingTarget)} className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary">
                <option value="ATLETA_INDEPENDENTE">Atleta</option>
                <option value="TREINADOR_PARTICULAR">Treinador</option>
                <option value="GESTOR_CT">Gestor CT</option>
              </select>
            </div>
            <div>
              <label className="text-telemetry-text-muted block mb-1">Preço Mensal (R$)</label>
              <input type="number" step="0.01" value={form.monthlyPrice} onChange={(e) => form.setMonthlyPrice(e.target.value)} required className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary" />
            </div>
            <div>
              <label className="text-telemetry-text-muted block mb-1">Preço Anual (R$)</label>
              <input type="number" step="0.01" value={form.yearlyPrice} onChange={(e) => form.setYearlyPrice(e.target.value)} required className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-telemetry-text-muted block mb-1">Cota Atletas</label>
              <input type="number" value={form.quotaAthletes} onChange={(e) => form.setQuotaAthletes(e.target.value)} placeholder="Ilimitado" className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary" />
            </div>
            <div>
              <label className="text-telemetry-text-muted block mb-1">Cota Treinadores</label>
              <input type="number" value={form.quotaCoaches} onChange={(e) => form.setQuotaCoaches(e.target.value)} placeholder="0" className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary" />
            </div>
            <div>
              <label className="text-telemetry-text-muted block mb-1">Atleta Extra (R$)</label>
              <input type="number" step="0.01" value={form.extraAthletePrice} onChange={(e) => form.setExtraAthletePrice(e.target.value)} placeholder="—" className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2 py-1.5 text-telemetry-text-primary" />
            </div>
          </div>
          <div>
            <label className="text-telemetry-text-muted block mb-1">Descrição / Tooltip</label>
            <input value={form.tooltip} onChange={(e) => form.setTooltip(e.target.value)} className="w-full bg-telemetry-elevated border border-telemetry-border/20 rounded px-2.5 py-1.5 text-telemetry-text-primary" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-telemetry-border/10">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded text-telemetry-text-muted hover:text-white">Cancelar</button>
            <button type="submit" disabled={form.saving} className="px-4 py-1.5 rounded font-semibold bg-telemetry-blue hover:bg-telemetry-blue-light text-white">
              {form.saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
