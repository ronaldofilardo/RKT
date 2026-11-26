'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { PlanTier, BillingCycle } from '@/types/billing';
import { BILLING_PLANS } from '@/core/billing/billing-plans';

interface CheckoutModalProps {
  isOpen: boolean;
  planId: PlanTier;
  cycle: BillingCycle;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ isOpen, planId, cycle, onClose, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; copiaECola: string; subId: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  const plan = BILLING_PLANS.find((p) => p.id === planId);
  const value = plan ? (cycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice) : 0;

  useEffect(() => {
    if (!pixData?.subId || paid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/pix-status?subscriptionId=${pixData.subId}`);
        if (res.ok && (await res.json()).isPaid) {
          setPaid(true);
          clearInterval(interval);
          setTimeout(() => onSuccess(), 2000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [pixData, paid, onSuccess]);

  const handleGeneratePix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: planId, cycle, billingType: 'PIX' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.pix) {
          setPixData({ qrCode: json.data.pix.qrCodeBase64, copiaECola: json.data.pix.copiaECola, subId: json.data.subscriptionId });
        }
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
            <p className="font-semibold text-telemetry-text-primary">Pagamento confirmado!</p>
            <p className="text-xs text-telemetry-text-secondary">Sua assinatura está ativa. Liberando acesso ilimitado...</p>
          </div>
        ) : !pixData ? (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-telemetry-base rounded border border-telemetry-border text-xs space-y-1">
              <p className="text-telemetry-text-secondary">Total a pagar ({cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}):</p>
              <p className="text-xl font-bold text-telemetry-text-primary">R$ {value.toFixed(2).replace('.', ',')}</p>
            </div>
            <button type="button" onClick={handleGeneratePix} disabled={loading} className="w-full py-2.5 rounded text-xs font-semibold bg-telemetry-blue hover:bg-telemetry-blue/80 text-white transition-colors">
              {loading ? 'Gerando Pix...' : 'Pagar com Pix Instantâneo'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-xs text-telemetry-text-secondary">Escaneie o QR Code abaixo no app do seu banco:</p>
            <Image src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code Pix" width={176} height={176} className="mx-auto rounded border border-telemetry-border p-1 bg-white" />
            <button type="button" onClick={() => { navigator.clipboard.writeText(pixData.copiaECola); setCopied(true); }} className="w-full py-2 rounded text-xs border border-telemetry-border bg-telemetry-base hover:bg-telemetry-border text-telemetry-text-primary transition-colors">
              {copied ? '✓ Código Pix Copiado!' : 'Copiar Código Pix (Copia e Cola)'}
            </button>
            <p className="text-[11px] text-telemetry-text-secondary flex items-center justify-center gap-1.5"><span className="animate-spin text-xs">⟳</span> Aguardando confirmação do banco...</p>
          </div>
        )}
      </div>
    </div>
  );
}
