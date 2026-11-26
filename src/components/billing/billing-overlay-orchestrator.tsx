'use client';

import React, { useState, useEffect } from 'react';
import type { BillingAccountState, PlanTier, BillingCycle } from '@/types/billing';
import { TrialCounterBar } from './trial-counter-bar';
import { LastFreeAccessModal } from './last-free-access-modal';
import { PaywallModal } from './paywall-modal';

interface BillingOverlayOrchestratorProps {
  billing: BillingAccountState | null;
  onRefreshBilling?: () => void;
}

export function BillingOverlayOrchestrator({
  billing,
}: BillingOverlayOrchestratorProps) {
  const [showLastFreeModal, setShowLastFreeModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  useEffect(() => {
    if (billing?.status === 'LAST_FREE') {
      const ack = typeof window !== 'undefined' ? sessionStorage.getItem('rkt_last_free_ack') : null;
      if (!ack) {
        setShowLastFreeModal(true);
      }
    }
  }, [billing?.status]);

  const handleProceedLastFree = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rkt_last_free_ack', 'true');
    }
    setShowLastFreeModal(false);
  };

  const handleSubscribe = (planId: PlanTier, cycle: BillingCycle) => {
    // Redireciona para o fluxo de checkout com os parâmetros selecionados
    if (typeof window !== 'undefined') {
      const url = `/checkout?plan=${encodeURIComponent(planId)}&cycle=${encodeURIComponent(cycle)}`;
      window.location.href = url;
    }
  };

  return (
    <>
      <TrialCounterBar
        billing={billing}
        onOpenPlans={() => setShowPaywallModal(true)}
      />

      <LastFreeAccessModal
        isOpen={showLastFreeModal}
        billing={billing}
        onProceedLastFree={handleProceedLastFree}
        onSubscribe={handleSubscribe}
      />

      <PaywallModal
        isOpen={showPaywallModal}
        billing={billing}
        onClose={() => setShowPaywallModal(false)}
        onSubscribe={handleSubscribe}
      />
    </>
  );
}
