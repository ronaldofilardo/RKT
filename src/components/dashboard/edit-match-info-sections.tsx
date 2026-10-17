'use client';

import { FormField, SelectField, TextInput, TextareaField } from './edit-match-info-fields';
import { ROUND_OPTIONS } from '@/app/match/new/matchConstants';
import type { EditMatchInfoFormValues } from './edit-match-info-submission';

export type Change = <K extends keyof EditMatchInfoFormValues>(
  key: K,
  value: EditMatchInfoFormValues[K]
) => void;

export interface SectionProps {
  values: EditMatchInfoFormValues;
  onChange: Change;
}

export const SECTION_TITLE_CLASS =
  'text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2';

const GRID_2 = 'grid grid-cols-2 gap-3';

export function DateTimeSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <h3 className={SECTION_TITLE_CLASS}>Data e Horário</h3>
      <div className={GRID_2}>
        <FormField htmlFor="edit-match-date" label="Data">
          <TextInput id="edit-match-date" type="date" value={values.date} onChange={(v) => onChange('date', v)} />
        </FormField>
        <FormField htmlFor="edit-match-time" label="Horário (opcional)">
          <TextInput id="edit-match-time" type="time" value={values.time} onChange={(v) => onChange('time', v)} />
        </FormField>
      </div>
    </div>
  );
}

export function TournamentSection({ values, onChange }: SectionProps) {
  const matchingOption = ROUND_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === (values.round || '').toLowerCase()
  );
  const isCustomRound = Boolean(
    values.round && !matchingOption && !ROUND_OPTIONS.some((opt) => opt.value === values.round)
  );

  return (
    <div>
      <h3 className={SECTION_TITLE_CLASS}>Torneio</h3>
      <div className="space-y-3">
        <FormField htmlFor="edit-tournament" label="Nome do Torneio">
          <TextInput id="edit-tournament" value={values.tournamentName} placeholder="Ex: Torneio Aberto" onChange={(v) => onChange('tournamentName', v)} />
        </FormField>
        <div className={GRID_2}>
          <FormField htmlFor="edit-club" label="Clube" hint="(opcional)">
            <TextInput id="edit-club" value={values.clubName} placeholder="Nome do clube" onChange={(v) => onChange('clubName', v)} />
          </FormField>
          <FormField htmlFor="edit-round" label="Rodada">
            <SelectField
              id="edit-round"
              value={matchingOption ? matchingOption.value : values.round}
              onChange={(v) => onChange('round', v)}
            >
              <option value="">Selecione a rodada</option>
              {isCustomRound && (
                <option value={values.round}>
                  {values.round}
                </option>
              )}
              {ROUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
      </div>
    </div>
  );
}

export function DetailsSection({ values, onChange }: SectionProps) {
  return (
    <FormField htmlFor="edit-details" label="Detalhes / Observações">
      <TextareaField
        id="edit-details"
        value={values.details}
        placeholder="Observações ou detalhes adicionais da partida"
        onChange={(v) => onChange('details', v)}
      />
    </FormField>
  );
}

export function FormFooter({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 text-xs font-medium text-telemetry-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 text-xs font-semibold text-white bg-telemetry-blue hover:bg-telemetry-blue-light rounded-lg transition-colors shadow-sm disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </div>
  );
}
