'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

export function useCoachEcaOnboarding(isParticular: boolean) {
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Consulta status de aceite
  const checkStatus = async () => {
    if (!isParticular) return;
    try {
      const res = await fetch('/api/coach/particular/onboarding-status');
      if (res.ok) {
        const data = await res.json();
        setNeedsAcceptance(!data.accepted);
      }
    } catch (err) {
      logger.warn('[COACH ECA] Falha ao verificar status:', err);
    }
  };

  const acceptTerms = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/coach/particular/accept-terms', { method: 'POST' });
      if (res.ok) {
        setNeedsAcceptance(false);
        return true;
      }
    } catch (err) {
      logger.error('[COACH ECA] Falha ao aceitar termos:', err);
    } finally {
      setSubmitting(false);
    }
    return false;
  };

  return {
    isOpen: Boolean(needsAcceptance),
    checkStatus,
    acceptTerms,
    submitting,
  };
}
