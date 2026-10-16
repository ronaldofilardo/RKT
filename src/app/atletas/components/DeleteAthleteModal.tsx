'use client';

interface DeleteAthleteModalProps {
  athleteName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAthleteModal({
  athleteName,
  deleting,
  onCancel,
  onConfirm,
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
        <h3 className="text-lg font-bold text-telemetry-text-primary mb-2">Excluir Atleta</h3>
        <p className="text-sm text-telemetry-text-muted mb-4">
          Tem certeza que deseja excluir <span className="font-semibold text-telemetry-text-primary">{athleteName}</span>? Esta ação não pode ser desfeita.
        </p>
        <p className="text-xs text-telemetry-text-muted/70 mb-6">
          Caso o atleta possua partidas em andamento ou finalizadas, a exclusão será bloqueada para não afetar essas partidas.
        </p>
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
