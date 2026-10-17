'use client';

import { FormField, SelectField, TextInput } from './edit-match-info-fields';
import { SECTION_TITLE_CLASS, type SectionProps } from './edit-match-info-sections';

const GRID_2 = 'grid grid-cols-2 gap-3';

export function CourtSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <FormField htmlFor="edit-visibility" label="Visibilidade">
        <SelectField id="edit-visibility" value={values.visibility} onChange={(v) => onChange('visibility', v)}>
          <option value="PUBLIC">Pública</option>
          <option value="PRIVATE">Privada</option>
        </SelectField>
      </FormField>
    </div>
  );
}

export function WeatherSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <h3 className={SECTION_TITLE_CLASS}>Condições Climáticas (opcional)</h3>
      <div className={GRID_2}>
        <FormField htmlFor="edit-temp" label="Temperatura (°C)">
          <TextInput id="edit-temp" type="number" value={values.temperature} placeholder="Ex: 25" onChange={(v) => onChange('temperature', v)} />
        </FormField>
        <FormField htmlFor="edit-humidity" label="Umidade (%)">
          <TextInput id="edit-humidity" type="number" value={values.humidity} placeholder="Ex: 60" onChange={(v) => onChange('humidity', v)} />
        </FormField>
      </div>
    </div>
  );
}
