'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BillingAccountState } from '@/types/billing';

export function useBillingStatus(initialBilling?: BillingAccountState | null) {
  const [billing, setBilling] = useState<BillingAccountState | null>(initialBilling ?? null);
  const [loading, setLoading] = useState(!initialBilling);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.billing) {
          setBilling(data.billing);
        }
      }
    } catch {
      // Ignora erro de rede em background
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBilling) {
      fetchBilling();
    }
  }, [fetchBilling, initialBilling]);

  return { billing, loading, refreshBilling: fetchBilling };
}
