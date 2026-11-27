'use client';

import React, { useState, useEffect } from 'react';
import type { PlanTier, BillingCycle } from '@/types/billing';
import { BILLING_PLANS } from '@/core/billing/billing-plans';
import { CheckoutPixView } from './checkout-pix-view';
import { CheckoutCardHostedView } from './checkout-card-hosted-view';

interface CheckoutModalProps {
  isOpen: boolean;
  planId: PlanTier;
  cycle: BillingCycle;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ isOpen, planId, cycle, onClose, onSuccess }: CheckoutModalProps) {
  const [tab, setTab] = useState<'PIX' | 'CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; copiaECola: string; subId: string } | null>(null);
  const [cardData, setCardData] = useState<{ invoiceUrl: string; subId: string } | null>(null);
  const [paid, setPaid] = useState(false);

  const plan = BILLING_PLANS.find((p) => p.id === planId);
  const value = plan ? (cycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice) : 0;
  const activeSubId = pixData?.subId || cardData?.subId;

  useEffect(() => {
    if (!activeSubId || paid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/pix-status?subscriptionId=${activeSubId}`);
        if (res.ok && (await res.json()).isPaid) {
          setPaid(true);
          clearInterval(interval);
          setTimeout(() => onSuccess(), 2000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSubId, paid, onSuccess]);

  const handleCreateSession = async (billingType: 'PIX' | 'CREDIT_CARD') => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: planId, cycle, billingType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Falha na requisição.');
      if (json.data?.pix) {
        setPixData({ qrCode: json.data.pix.qrCodeBase64, copiaECola: json.data.pix.copiaECola, subId: json.data.subscriptionId });
      }
      if (billingType === 'CREDIT_CARD' && json.data?.invoiceUrl) {
        setCardData({ invoiceUrl: json.data.invoiceUrl, subId: json.data.subscriptionId });
        window.open(json.data.invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-telemetry-surface border border-telemetry-border rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-telemetry-border pb-2.5">
          <h2 className="text-sm font-semibold text-telemetry-text-primary">Checkout Asaas — {plan.name}</h2>
          <button type="button" onClick={onClose} className="text-telemetry-text-secondary hover:text-telemetry-text-primary text-sm p-1">✕</button>
        </div>
        {paid ? (
          <div className="text-center py-6 space-y-2">
            <span className="text-4xl text-telemetry-volt">✓</span>
            <p className="font-semibold text-telemetry-text-primary">Assinatura confirmada!</p>
            <p className="text-xs text-telemetry-text-secondary">Seu plano está ativo. Liberando acesso ilimitado...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1 p-1 bg-telemetry-base rounded border border-telemetry-border text-xs">
              <button type="button" onClick={() => setTab('PIX')} className={`py-1.5 rounded font-medium transition-colors ${tab === 'PIX' ? 'bg-telemetry-surface text-telemetry-text-primary shadow-sm' : 'text-telemetry-text-secondary hover:text-telemetry-text-primary'}`}>⚡ Pix Instantâneo</button>
              <button type="button" onClick={() => setTab('CARD')} className={`py-1.5 rounded font-medium transition-colors ${tab === 'CARD' ? 'bg-telemetry-surface text-telemetry-text-primary shadow-sm' : 'text-telemetry-text-secondary hover:text-telemetry-text-primary'}`}>💳 Cartão Recorrente</button>
            </div>
            {tab === 'PIX' ? (
              <CheckoutPixView pixData={pixData} loading={loading} value={value} cycle={cycle} onGeneratePix={() => handleCreateSession('PIX')} />
            ) : (
              <CheckoutCardHostedView invoiceUrl={cardData?.invoiceUrl ?? null} loading={loading} value={value} cycle={cycle} onStartCheckout={() => handleCreateSession('CREDIT_CARD')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
