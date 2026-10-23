'use client';

import { FormField, TextInput, TextareaField } from './edit-match-info-fields';
import { SECTION_TITLE_CLASS, type Change } from './edit-match-info-section-shared';
import type { EditMatchInfoFormValues } from './edit-match-info-submission';

const GRID_2 = 'grid grid-cols-2 gap-3';

export function DateTimeSection({
  values,
  onChange,
}: {
  values: EditMatchInfoFormValues;
  onChange: Change;
}) {
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

export function DetailsSection({
  values,
  onChange,
}: {
  values: EditMatchInfoFormValues;
  onChange: Change;
}) {
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
