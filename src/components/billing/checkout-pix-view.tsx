'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface CheckoutPixViewProps {
  pixData: { qrCode: string; copiaECola: string } | null;
  loading: boolean;
  value: number;
  cycle: 'MONTHLY' | 'YEARLY';
  onGeneratePix: () => void;
}

export function CheckoutPixView({ pixData, loading, value, cycle, onGeneratePix }: CheckoutPixViewProps) {
  const [copied, setCopied] = useState(false);

  if (!pixData) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-3 bg-telemetry-base rounded border border-telemetry-border text-xs space-y-1">
          <p className="text-telemetry-text-secondary">Total a pagar ({cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}):</p>
          <p className="text-xl font-bold text-telemetry-text-primary">R$ {value.toFixed(2).replace('.', ',')}</p>
        </div>
        <button
          type="button"
          onClick={onGeneratePix}
          disabled={loading}
          className="w-full py-2.5 rounded text-xs font-semibold bg-telemetry-blue hover:bg-telemetry-blue/80 text-white transition-colors"
        >
          {loading ? 'Gerando Pix...' : 'Pagar com Pix Instantâneo'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-xs text-telemetry-text-secondary">Escaneie o QR Code abaixo no app do seu banco:</p>
      <Image
        src={`data:image/png;base64,${pixData.qrCode}`}
        alt="QR Code Pix"
        width={176}
        height={176}
        className="mx-auto rounded border border-telemetry-border p-1 bg-white"
      />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(pixData.copiaECola);
          setCopied(true);
        }}
        className="w-full py-2 rounded text-xs border border-telemetry-border bg-telemetry-base hover:bg-telemetry-border text-telemetry-text-primary transition-colors"
      >
        {copied ? '✓ Código Pix Copiado!' : 'Copiar Código Pix (Copia e Cola)'}
      </button>
      <p className="text-[11px] text-telemetry-text-secondary flex items-center justify-center gap-1.5">
        <span className="animate-spin text-xs">⟳</span> Aguardando confirmação do banco...
      </p>
    </div>
  );
}
