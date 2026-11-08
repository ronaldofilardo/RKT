'use client';

import { useEffect, useRef, useState } from 'react';
import { buildResetLink, formatLinkExpiry } from './link-copy-modal.logic';
import { CheckIcon, CopyIcon } from './link-copy-icons';

interface LinkCopyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  recipientName: string;
  token: string;
  expiresAt?: string;
}

export function LinkCopyModal({
  open,
  onOpenChange,
  title,
  recipientName,
  token,
  expiresAt,
}: LinkCopyModalProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const resetLink = buildResetLink(origin, token);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem clipboard disponível: o texto permanece selecionável para cópia manual.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-telemetry-text-primary">{title}</h2>
          <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary" aria-label="Fechar">✕</button>
        </div>

        <p className="text-sm text-telemetry-text-muted mb-4">
          Envie este link para <span className="font-semibold text-telemetry-text-primary">{recipientName}</span> criar ou redefinir a senha de acesso:
        </p>

        <div className="bg-telemetry-base border border-telemetry-border/30 rounded-lg p-3 mb-4">
          <p className="text-xs font-mono text-telemetry-text-primary break-all select-all">{resetLink}</p>
        </div>

        <div className="text-xs text-telemetry-alert bg-telemetry-alert/10 p-2.5 rounded-lg mb-6 border border-telemetry-alert/30 space-y-1">
          <p className="font-medium">{formatLinkExpiry(expiresAt)}</p>
          <p className="text-telemetry-text-muted">Uso único</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-telemetry-text-muted hover:text-telemetry-text-primary"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-telemetry-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-telemetry-blue/90 text-sm flex items-center gap-1.5"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  );
}
