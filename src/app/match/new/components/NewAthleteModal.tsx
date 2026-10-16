'use client';

import { NewAthleteModalForm } from './NewAthleteModalForm';
import { toggleRankingEntry, updateRankingField } from '@/app/atletas/rankingLogic';
import { useNewAthleteModal } from './use-new-athlete-modal';
import type { Athlete } from '../types';

interface NewAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
}

export function NewAthleteModal({ isOpen, onClose, onCreated }: NewAthleteModalProps) {
  const {
    submitting, error, nameInputRef, form, setForm, rankings, setRankings, age, submitFormPayload,
  } = useNewAthleteModal({ isOpen, onClose, onCreated });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
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
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-telemetry-elevated border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-telemetry-text-primary">Novo Atleta</h2>
            <p className="text-xs text-telemetry-text-muted">Preencha os dados do jogador</p>
          </div>
          <button type="button" onClick={onClose} className="text-telemetry-text-muted hover:text-telemetry-text-primary text-2xl p-1 transition-colors">
            ×
          </button>
        </div>
        <form onSubmit={submitFormPayload} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-sm rounded-lg">{error}</div>
          )}

          <NewAthleteModalForm
            form={form}
            setForm={setForm}
            rankings={rankings}
            setRankings={setRankings}
            age={age}
            submitting={submitting}
            nameInputRef={nameInputRef}
            onRankingToggle={(type) => toggleRankingEntry(setRankings, type)}
            onRankingFieldChange={(type, field, value) => updateRankingField(setRankings, type, field, value)}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-transparent border border-white/10 text-telemetry-text-muted font-semibold py-2.5 rounded-lg hover:bg-telemetry-elevated hover:text-telemetry-text-primary disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 bg-telemetry-blue text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(37,99,235,0.3)]"
            >
              {submitting ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
