'use client';

interface UndoConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  pointDescription?: string;
}

export function UndoConfirmModal({ onConfirm, onCancel, loading, pointDescription }: UndoConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') onCancel();
        }}
      />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Desfazer ponto?</h2>
        {pointDescription && (
          <p className="text-sm text-telemetry-text-muted mb-6">{pointDescription}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 px-4 bg-telemetry-elevated hover:bg-telemetry-active border border-white/10 text-telemetry-text-primary font-semibold rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 px-4 bg-telemetry-alert hover:opacity-90 disabled:opacity-50 text-telemetry-base font-semibold rounded-xl transition-all">
            {loading ? 'Desfazendo...' : 'Desfazer'}
          </button>
        </div>
      </div>
    </div>
  );
}
