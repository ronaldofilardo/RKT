'use client';

interface ConfirmDeleteMatchDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

/** Diálogo modal de confirmação de exclusão definitiva de partida. */
export function ConfirmDeleteMatchDialog({ onCancel, onConfirm }: ConfirmDeleteMatchDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-match-title"
        className="relative bg-telemetry-card rounded-lg p-6 max-w-sm border border-white/10"
      >
        <h3 id="confirm-delete-match-title" className="font-bold mb-2 text-telemetry-text-primary">Excluir partida?</h3>
        <p className="text-sm text-telemetry-text-muted mb-4">
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-telemetry-elevated hover:bg-telemetry-active text-telemetry-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-telemetry-error hover:bg-red-500 text-white transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
