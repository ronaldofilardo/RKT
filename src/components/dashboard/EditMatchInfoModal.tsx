'use client';

import { useState } from 'react';
import type { DashboardMatchPayload } from './match-card-types';
import { buildUpdateInfoPayload, initialFormValues, type EditMatchInfoFormValues } from './edit-match-info-submission';
import {
  DateTimeSection,
  DetailsSection,
  FormFooter,
  TournamentSection,
} from './edit-match-info-sections';
import { CourtSection, WeatherSection } from './edit-match-info-grid-sections';
import { useToast } from '@/components/Toast';
import { matchesClient } from '@/services/matchesClient';

interface EditMatchInfoModalProps {
  match: DashboardMatchPayload;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMatchInfoModal({ match, onClose, onSuccess }: EditMatchInfoModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<EditMatchInfoFormValues>(() => initialFormValues(match));

  const updateFieldValue = <K extends keyof EditMatchInfoFormValues>(
    key: K,
    value: EditMatchInfoFormValues[K]
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const submitMatchInfoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await matchesClient.updateMatchInfo(match.id, buildUpdateInfoPayload(values, match.version));

      toast({
        type: 'success',
        message: 'Informações da partida atualizadas com sucesso!',
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        type: 'error',
        message:
          (error instanceof Error ? error.message : undefined) ||
          'Falha ao salvar alterações da partida',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-match-info-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-telemetry-elevated border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-telemetry-card">
          <div>
            <h2 id="edit-match-info-title" className="text-base font-bold text-telemetry-text-primary">
              ⚙️ Editar Informações da Partida
            </h2>
            <p className="text-xs text-telemetry-text-muted mt-0.5">
              {match.player1.name} vs {match.player2.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-telemetry-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitMatchInfoForm} className="p-6 overflow-y-auto space-y-4 scrollbar-thin">
          <DateTimeSection values={values} onChange={updateFieldValue} />
          <TournamentSection values={values} onChange={updateFieldValue} />
          <CourtSection values={values} onChange={updateFieldValue} />
          <WeatherSection values={values} onChange={updateFieldValue} />
          <DetailsSection values={values} onChange={updateFieldValue} />
          <FormFooter saving={saving} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}
