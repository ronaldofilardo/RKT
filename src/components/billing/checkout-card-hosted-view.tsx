'use client';

import React from 'react';

interface CheckoutCardHostedViewProps {
  invoiceUrl: string | null;
  loading: boolean;
  value: number;
  cycle: 'MONTHLY' | 'YEARLY';
  onStartCheckout: () => void;
}

export function CheckoutCardHostedView({
  invoiceUrl,
  loading,
  value,
  cycle,
  onStartCheckout,
}: CheckoutCardHostedViewProps) {
  if (!invoiceUrl) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-3 bg-telemetry-base rounded border border-telemetry-border text-xs space-y-1">
          <p className="text-telemetry-text-secondary">Total da assinatura ({cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}):</p>
          <p className="text-xl font-bold text-telemetry-text-primary">R$ {value.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="p-3 bg-telemetry-surface rounded border border-telemetry-border/60 text-xs text-telemetry-text-secondary space-y-1.5">
          <p className="font-medium text-telemetry-text-primary flex items-center gap-1.5">
            <span>🔒</span> Checkout Seguro Direto no Asaas
          </p>
          <p className="text-[11px] leading-relaxed">
            Seus dados de cartão são preenchidos diretamente na plataforma oficial do Asaas, com criptografia ponta a ponta e certificação PCI-DSS. O RKT não tem acesso e nem armazena os dados do seu cartão.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartCheckout}
          disabled={loading}
          className="w-full py-2.5 rounded text-xs font-semibold bg-telemetry-blue hover:bg-telemetry-blue/80 text-white transition-colors"
        >
          {loading ? 'Preparando Checkout...' : 'Ir para Pagamento Seguro no Asaas ➔'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2 text-center">
      <div className="p-4 bg-telemetry-base rounded border border-telemetry-border text-xs space-y-2">
        <p className="font-semibold text-telemetry-text-primary">Página de pagamento aberta no Asaas</p>
        <p className="text-telemetry-text-secondary text-[11px] leading-relaxed">
          Conclua o pagamento na aba aberta. Assim que a cobrança for confirmada, sua conta será ativada automaticamente.
        </p>
      </div>
      <a
        href={invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2.5 rounded text-xs font-semibold bg-telemetry-surface hover:bg-telemetry-border border border-telemetry-border text-telemetry-text-primary transition-colors"
      >
        Reabrir Página do Asaas ↗
      </a>
      <p className="text-[11px] text-telemetry-text-secondary flex items-center justify-center gap-1.5">
        <span className="animate-spin text-xs">⟳</span> Aguardando confirmação do pagamento...
      </p>
    </div>
  );
}
