'use client';

import type { Athlete } from './useAtletasController';

type DeleteAthleteModalProps = {
  athlete: Athlete;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAthleteModal({ athlete, deleting, onCancel, onConfirm }: DeleteAthleteModalProps) {
  const closeOnKey = (event: React.KeyboardEvent) => {
    if ((event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && !deleting) onCancel();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onKeyDown={closeOnKey}>
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} role="button" tabIndex={-1} aria-label="Fechar modal" onKeyDown={closeOnKey} />
    <div className="relative bg-telemetry-elevated rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-telemetry-text-primary mb-2">Excluir Atleta</h3>
      <p className="text-sm text-telemetry-text-muted mb-4">Tem certeza que deseja excluir <span className="font-semibold text-telemetry-text-primary">{athlete.name}</span>? Esta ação não pode ser desfeita.</p>
      <p className="text-xs text-telemetry-text-muted mb-6">Caso o atleta possua partidas em andamento ou finalizadas, a exclusão será bloqueada para não afetar essas partidas.</p>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={deleting} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-telemetry-text-primary font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">Cancelar</button>
        <button type="button" onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting ? 'Excluindo...' : 'Excluir'}</button>
      </div>
    </div>
  </div>;
}
