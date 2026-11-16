'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DependentSummary } from '@/app/api/guardians/me/dependents/dependents-read.logic';

export function useGuardianDependents() {
  const [dependents, setDependents] = useState<DependentSummary[]>([]);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const fetchDependents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardians/me/dependents');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao carregar dependentes.');
      setDependents(data.dependents || []);
      setCanOperate(Boolean(data.canOperate));
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependents();
  }, [fetchDependents]);

  const toggleConsent = async (playerId: string, purpose: 'BROADCAST' | 'STATS', current: boolean) => {
    const action = current ? 'revoke' : 'grant';
    setMutatingId(`${playerId}-${purpose}`);
    try {
      const res = await fetch('/api/guardians/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, purpose, action, termsVersion: '2.0' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao atualizar consentimento.');
      setDependents((prev) =>
        prev.map((d) => (d.playerId === playerId ? { ...d, consents: { ...d.consents, [purpose]: !current } } : d))
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar autorização.');
    } finally {
      setMutatingId(null);
    }
  };

  const upgradeAccount = async () => {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardians/me/upgrade', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao realizar upgrade.');
      setCanOperate(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar upgrade.');
    } finally {
      setUpgrading(false);
    }
  };

  return { dependents, canOperate, loading, error, mutatingId, upgrading, toggleConsent, upgradeAccount, refetch: fetchDependents };
}
