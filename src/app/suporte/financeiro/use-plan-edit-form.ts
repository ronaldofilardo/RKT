'use client';

import { useState } from 'react';
import type { PlanDefinition, BillingTarget } from '@/types/billing';

export function usePlanEditForm(plan: PlanDefinition | null, onSaved: () => void, onClose: () => void) {
  const isNew = !plan;
  const [tierCode, setTierCode] = useState(plan?.id ?? '');
  const [name, setName] = useState(plan?.name ?? '');
  const [target, setTarget] = useState<BillingTarget>(plan?.target ?? 'ATLETA_INDEPENDENTE');
  const [monthlyPrice, setMonthlyPrice] = useState(plan?.monthlyPrice?.toString() ?? '19.99');
  const [yearlyPrice, setYearlyPrice] = useState(plan?.yearlyPrice?.toString() ?? '199.99');
  const [quotaAthletes, setQuotaAthletes] = useState(plan?.quotaAthletes?.toString() ?? '');
  const [quotaCoaches, setQuotaCoaches] = useState(plan?.quotaCoaches?.toString() ?? '');
  const [extraAthletePrice, setExtraAthletePrice] = useState(plan?.extraAthletePrice?.toString() ?? '');
  const [tooltip, setTooltip] = useState(plan?.tooltip ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tierCode: tierCode.trim().toUpperCase(),
        name: name.trim(),
        target,
        monthlyPrice: parseFloat(monthlyPrice),
        yearlyPrice: parseFloat(yearlyPrice),
        quotaAthletes: quotaAthletes ? parseInt(quotaAthletes, 10) : null,
        quotaCoaches: quotaCoaches ? parseInt(quotaCoaches, 10) : null,
        extraAthletePrice: extraAthletePrice ? parseFloat(extraAthletePrice) : null,
        tooltip: tooltip.trim(),
        features: plan?.features ?? [{ title: 'Anotação de partidas', included: true }],
      };
      const res = await fetch('/api/suporte/financeiro/plans', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao salvar dados do plano.');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return {
    isNew, tierCode, setTierCode, name, setName, target, setTarget,
    monthlyPrice, setMonthlyPrice, yearlyPrice, setYearlyPrice,
    quotaAthletes, setQuotaAthletes, quotaCoaches, setQuotaCoaches,
    extraAthletePrice, setExtraAthletePrice, tooltip, setTooltip,
    saving, error, handleSubmit,
  };
}
