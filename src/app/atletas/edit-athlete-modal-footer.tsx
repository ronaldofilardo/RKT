'use client';

interface EditAthleteModalFooterProps {
  saving: boolean;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditAthleteModalFooter({ saving, canSave, onClose, onSave }: EditAthleteModalFooterProps) {
  return (
    <div className="px-4 py-3 border-t border-white/10 bg-telemetry-elevated flex gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex-1 px-4 py-2.5 bg-transparent border border-white/10 text-telemetry-text-muted font-medium rounded-lg hover:bg-white/5 hover:text-telemetry-text-primary disabled:opacity-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !canSave}
        className="flex-1 px-4 py-2.5 bg-telemetry-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm shadow-telemetry-blue/20"
      >
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </div>
  );
}
