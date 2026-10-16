'use client';

import { RankingForm } from './RankingForm';
import { EditAthletePersonalFields } from './components/EditAthletePersonalFields';
import type { EditAthleteModalProps } from './edit-athlete-modal.types';
import { useEditAthleteModal } from './use-edit-athlete-modal';

export type { EditAthleteSavePayload } from './edit-athlete-modal.types';

export function EditAthleteModal({ athlete, isOpen, onClose, onSave }: EditAthleteModalProps) {
  const {
    form,
    setForm,
    rankings,
    age,
    saving,
    error,
    handleRankingToggle,
    handleRankingFieldChange,
    handleSave,
  } = useEditAthleteModal({ athlete, onSave });

  if (!isOpen || !athlete) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-telemetry-elevated">
          <div>
            <h2 className="text-base font-bold text-telemetry-text-primary">Editar Atleta</h2>
            <p className="text-xs text-telemetry-text-muted">{athlete.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className="p-2 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert rounded-lg text-sm">
              {error}
            </div>
          )}

          <EditAthletePersonalFields form={form} setForm={setForm} saving={saving} />

          <RankingForm
            form={form}
            rankings={rankings}
            age={age}
            saving={saving}
            onRankingToggle={handleRankingToggle}
            onRankingFieldChange={handleRankingFieldChange}
          />
        </div>

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
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2.5 bg-telemetry-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm shadow-telemetry-blue/20"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
