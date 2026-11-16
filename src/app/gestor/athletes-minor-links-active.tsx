'use client';

import { useState } from 'react';
import { buildResetLink, formatLinkExpiry } from './link-copy-modal.logic';
import { CheckIcon, CopyIcon } from './link-copy-icons';

interface AthletesMinorLinksActiveProps {
  minorName: string;
  token: string;
  guardianNoticeToken: string;
  guardianName?: string;
  expiresAt?: string;
  onClose: () => void;
}

export function AthletesMinorLinksActive({
  minorName, token, guardianNoticeToken, guardianName, expiresAt, onClose,
}: AthletesMinorLinksActiveProps) {
  const [copiedMinor, setCopiedMinor] = useState(false);
  const [copiedGuardian, setCopiedGuardian] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const minorLink = buildResetLink(origin, token);
  const guardianLink = `${origin}/responsavel/aviso-ativacao/${guardianNoticeToken}`;

  const copyText = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="bg-telemetry-base border border-telemetry-border/30 rounded-xl p-3 space-y-2">
          <span className="text-xs font-medium text-telemetry-text-primary block">
            1. Ativação da Conta do Atleta ({minorName})
          </span>
          <p className="text-[11px] text-telemetry-text-muted">Envie para o atleta criar sua senha de acesso:</p>
          <div className="flex gap-2">
            <input readOnly value={minorLink} className="flex-1 bg-telemetry-elevated/60 border border-telemetry-border/20 rounded p-1.5 text-xs font-mono select-all" />
            <button onClick={() => copyText(minorLink, setCopiedMinor)} className="bg-telemetry-blue text-white px-3 py-1 rounded text-xs flex items-center gap-1 font-medium">
              {copiedMinor ? <CheckIcon /> : <CopyIcon />} {copiedMinor ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="bg-telemetry-base border border-telemetry-border/30 rounded-xl p-3 space-y-2">
          <span className="text-xs font-medium text-telemetry-text-primary block">
            2. Aviso ao Responsável Legal ({guardianName || 'Responsável'})
          </span>
          <p className="text-[11px] text-telemetry-text-muted">Comunicação de ciência sobre a ativação da conta:</p>
          <div className="flex gap-2">
            <input readOnly value={guardianLink} className="flex-1 bg-telemetry-elevated/60 border border-telemetry-border/20 rounded p-1.5 text-xs font-mono select-all" />
            <button onClick={() => copyText(guardianLink, setCopiedGuardian)} className="bg-telemetry-elevated hover:bg-telemetry-elevated/80 text-telemetry-text-primary border border-telemetry-border/30 px-3 py-1 rounded text-xs flex items-center gap-1 font-medium">
              {copiedGuardian ? <CheckIcon /> : <CopyIcon />} {copiedGuardian ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
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
