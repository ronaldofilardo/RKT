'use client';

import { useState } from 'react';

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

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const resetLink = `${origin}/trocar-senha?token=${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para seleção de texto
    }
  };

  const formattedExpires = expiresAt
    ? new Date(expiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '7 dias';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Link gerado para <span className="font-semibold text-gray-900">{recipientName}</span>. Envie este link para o membro cadastrar ou redefinir sua senha:
        </p>

        <div className="bg-gray-50 border rounded-lg p-3 mb-4">
          <p className="text-xs font-mono text-gray-700 break-all select-all">{resetLink}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mb-6 border border-amber-200">
          <span>Expira em: <strong>{formattedExpires}</strong></span>
          <span>Uso único</span>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-800 text-sm flex items-center gap-1.5"
          >
            {copied ? '✓ Copiado!' : 'Copiar Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

