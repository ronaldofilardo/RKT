'use client';

import { FormField, TextInput, TextareaField } from './edit-match-info-fields';
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
const GRID_3 = 'grid grid-cols-3 gap-3';

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
  return (
    <div>
      <h3 className={SECTION_TITLE_CLASS}>Torneio e Chave</h3>
      <div className="space-y-3">
        <FormField htmlFor="edit-tournament" label="Nome do Torneio">
          <TextInput id="edit-tournament" value={values.tournamentName} placeholder="Ex: Torneio Aberto" onChange={(v) => onChange('tournamentName', v)} />
        </FormField>
        <FormField htmlFor="edit-club" label="Clube" hint="(opcional)">
          <TextInput id="edit-club" value={values.clubName} placeholder="Nome do clube" onChange={(v) => onChange('clubName', v)} />
        </FormField>
        <div className={GRID_3}>
          <FormField htmlFor="edit-category" label="Categoria">
            <TextInput id="edit-category" value={values.category} placeholder="Ex: 1ª Classe" onChange={(v) => onChange('category', v)} />
          </FormField>
          <FormField htmlFor="edit-round" label="Rodada">
            <TextInput id="edit-round" value={values.round} placeholder="Ex: Final, Quartas" onChange={(v) => onChange('round', v)} />
          </FormField>
          <FormField htmlFor="edit-bracket-type" label="Chave">
            <TextInput id="edit-bracket-type" value={values.bracketType} placeholder="Ex: Principal" onChange={(v) => onChange('bracketType', v)} />
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
