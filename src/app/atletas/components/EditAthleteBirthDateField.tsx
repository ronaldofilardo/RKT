import React from 'react';
import type { AthleteForm } from '../types';

interface EditAthleteBirthDateFieldProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  saving: boolean;
  age?: number | null;
}

export function EditAthleteBirthDateField({ form, setForm, saving, age }: EditAthleteBirthDateFieldProps) {
  return (
    <div className="col-span-3">
      <label htmlFor="edit-athlete-birthday" className="block text-xs font-medium text-telemetry-text-primary mb-1">
        Data de Nascimento
      </label>
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          id="edit-athlete-birthday" type="number" min="1" max="31" value={form.birthDay}
          onChange={(e) => setForm((p) => ({ ...p, birthDay: e.target.value }))}
          disabled={saving} placeholder="DD" maxLength={2}
          className="w-14 px-2 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-center text-xs"
        />
        <span className="text-telemetry-text-muted font-medium text-xs">/</span>
        <input
          aria-label="Mês de nascimento" type="number" min="1" max="12" value={form.birthMonth}
          onChange={(e) => setForm((p) => ({ ...p, birthMonth: e.target.value }))}
          disabled={saving} placeholder="MM" maxLength={2}
          className="w-14 px-2 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-center text-xs"
        />
        <span className="text-telemetry-text-muted font-medium text-xs">/</span>
        <input
          aria-label="Ano de nascimento" type="number" min="1900" max="2030" value={form.birthYear}
          onChange={(e) => setForm((p) => ({ ...p, birthYear: e.target.value }))}
          disabled={saving} placeholder="AAAA" maxLength={4}
          className="w-20 px-2 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-center text-xs"
        />
        {age !== null && age !== undefined && (
          <span className="text-xs text-telemetry-text-primary ml-1 whitespace-nowrap">
            Idade: <span className="font-semibold text-telemetry-volt">{age} anos</span>
          </span>
        )}
      </div>
    </div>
  );
}

