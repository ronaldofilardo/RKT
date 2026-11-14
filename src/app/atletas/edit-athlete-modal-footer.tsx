'use client';

interface EditAthleteModalFooterProps {
  saving: boolean;
  canSave: boolean;
  readOnly?: boolean;
  saveLabel?: string;
  onClose: () => void;
  onSave: () => void;
}

export function EditAthleteModalFooter({
  saving, canSave, readOnly, saveLabel, onClose, onSave,
}: EditAthleteModalFooterProps) {
  if (readOnly) {
    return (
      <div className="px-4 py-3 border-t border-white/10 bg-telemetry-elevated flex justify-end">
        <button
          type="button" onClick={onClose}
          className="w-full sm:w-auto px-6 py-2.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-white/10 bg-telemetry-elevated flex gap-3">
      <button
        type="button" onClick={onClose} disabled={saving}
        className="flex-1 px-4 py-2.5 bg-transparent border border-white/10 text-telemetry-text-muted font-medium rounded-lg hover:bg-white/5 hover:text-telemetry-text-primary disabled:opacity-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="button" onClick={onSave} disabled={saving || !canSave}
        className="flex-1 px-4 py-2.5 bg-telemetry-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm shadow-telemetry-blue/20"
      >
        {saving ? 'Salvando...' : (saveLabel || 'Salvar Alterações')}
      </button>
    </div>
  );
}
