'use client';

import type { ReactNode } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { getFormatLabel } from '@/core/scoring/format-labels';
import { EditScoreConfirmOverlay } from './edit-score-confirm-overlay';

interface EditScoreModalShellProps {
  children: ReactNode;
  isConfirming: boolean;
  matchFormat: TennisFormat;
  onCancel: () => void;
}

/** Casca do modal: backdrop fechável, card, overlay de salvamento, cabeçalho e slot de conteúdo. */
export function EditScoreModalShell({
  children,
  isConfirming,
  matchFormat,
  onCancel,
}: EditScoreModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={isConfirming ? undefined : onCancel}
        onKeyDown={(e) => {
          if (!isConfirming && (e.key === 'Escape' || e.key === 'Enter')) onCancel();
        }}
      />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <EditScoreConfirmOverlay isConfirming={isConfirming} />

        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-telemetry-text-primary">Editar Placar</h2>
          <p className="text-sm text-telemetry-text-muted mt-1">
            Modo de jogo: {getFormatLabel(matchFormat)}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
