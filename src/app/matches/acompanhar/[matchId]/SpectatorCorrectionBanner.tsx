import React from 'react';
import type { SpectatorCorrectionAlert } from '@/core/spectate';

export function SpectatorCorrectionBanner({
  alert,
  onDismiss,
}: {
  alert: SpectatorCorrectionAlert | null;
  onDismiss: () => void;
}) {
  if (!alert) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start justify-between gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs shadow-sm transition-all animate-fadeIn"
    >
      <div className="flex items-start gap-2">
        <span className="text-base">⚠️</span>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{alert.message}</span>
          {alert.from && alert.to && (
            <>
              <span className="font-mono text-[11px]">Antes: {alert.from}</span>
              <span className="font-mono text-[11px]">Agora: {alert.to}</span>
              <span className="text-[11px] text-amber-300/80">Os pontos entre esses placares não foram anotados.</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso de correção"
        className="px-2 py-1 text-[11px] rounded bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-colors"
      >
        Entendi
      </button>
    </div>
  );
}

