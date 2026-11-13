'use client';

import type { ReactNode } from 'react';

interface DeleteAthleteModalProps {
  athleteName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  /** Parágrafo principal do aviso. */
  description?: ReactNode;
  /** Nota secundária (ex.: bloqueio por partidas). Oculta quando ausente. */
  note?: ReactNode;
}

export function DeleteAthleteModal({
  athleteName, deleting, onCancel, onConfirm,
  title = 'Excluir Atleta',
  description,
  note,
}: DeleteAthleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => { if (!deleting) onCancel(); }}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!deleting) onCancel();
          }
        }}
      />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-telemetry-text-primary mb-2">{title}</h3>
        <p className="text-sm text-telemetry-text-muted mb-4">
          {description ?? (
            <>
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-telemetry-text-primary">{athleteName}</span>?
              Esta ação não pode ser desfeita.
            </>
          )}
        </p>
        {note && <p className="text-xs text-telemetry-text-muted/70 mb-6">{note}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-transparent border border-white/10 text-telemetry-text-muted font-medium rounded-lg hover:bg-telemetry-elevated hover:text-telemetry-text-primary disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-telemetry-alert text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
