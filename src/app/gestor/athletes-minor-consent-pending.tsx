'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from './link-copy-icons';
import { formatLinkExpiry } from './link-copy-modal.logic';

interface AthletesMinorConsentPendingProps {
  guardianName?: string;
  guardianNoticeToken: string;
  expiresAt?: string;
  onSimulateConsent: () => Promise<void>;
  onClose: () => void;
}

export function AthletesMinorConsentPending({
  guardianName, guardianNoticeToken, expiresAt, onSimulateConsent, onClose,
}: AthletesMinorConsentPendingProps) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${origin}/responsavel/convite/${guardianNoticeToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await onSimulateConsent();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
        <span className="text-xs font-semibold text-amber-400 block">Autorização Prévia Obrigatória</span>
        <p className="text-[11px] text-telemetry-text-muted leading-relaxed">
          Pelas diretrizes de proteção do menor (ECA Digital e LGPD), o responsável legal deve autorizar o uso da plataforma antes que o atleta possa criar sua senha de acesso.
        </p>
      </div>

      <div className="bg-telemetry-base border border-telemetry-border/30 rounded-xl p-3 space-y-2">
        <span className="text-xs font-medium text-telemetry-text-primary block">
          Link de Consentimento do Responsável ({guardianName || 'Responsável'})
        </span>
        <p className="text-[11px] text-telemetry-text-muted">Envie para o responsável autorizar o menor:</p>
        <div className="flex gap-2">
          <input readOnly value={inviteLink} className="flex-1 bg-telemetry-elevated/60 border border-telemetry-border/20 rounded p-1.5 text-xs font-mono select-all" />
          <button onClick={handleCopy} className="bg-telemetry-blue text-white px-3 py-1 rounded text-xs flex items-center gap-1 font-medium">
            {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="border border-dashed border-telemetry-border/40 rounded-xl p-3 bg-telemetry-elevated/20 text-center space-y-2">
        <div className="text-[11px] text-telemetry-text-muted">Ambiente de Demonstração / Homologação:</div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
        >
          {simulating ? 'Simulando Consentimento...' : '⚡ Simular Consentimento do Responsável (Placeholder)'}
        </button>
      </div>

      <div className="text-[11px] text-telemetry-text-muted bg-telemetry-elevated/30 p-2.5 rounded-lg border border-telemetry-border/20">
        {formatLinkExpiry(expiresAt)} • Uso único
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={onClose} className="bg-telemetry-elevated text-telemetry-text-primary font-medium py-1.5 px-4 rounded-lg text-xs hover:bg-telemetry-elevated/80">
          Fechar
        </button>
      </div>
    </div>
  );
}
