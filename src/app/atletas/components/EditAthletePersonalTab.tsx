import React from 'react';
import type { AthleteForm } from '../types';
import { EditAthleteBirthDateField } from './EditAthleteBirthDateField';
import { EditAthleteGuardianFields } from './EditAthleteGuardianFields';

interface EditAthletePersonalTabProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  saving: boolean;
  age?: number | null;
  showCpf?: boolean;
  cpfRequired?: boolean;
  guardianImmutable?: boolean;
}

export function EditAthletePersonalTab({
  form, setForm, saving, age, showCpf = true, cpfRequired = false, guardianImmutable = false,
}: EditAthletePersonalTabProps) {
  const isMinorAthlete = age != null && age < 18;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-athlete-name" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-athlete-name" type="text" required value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={saving}
            placeholder="Nome completo do atleta"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
          />
        </div>

        <div>
          <label htmlFor="edit-athlete-nickname" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Apelido (nickname) <span className="text-telemetry-text-muted">(opcional)</span>
          </label>
          <input
            id="edit-athlete-nickname" type="text" value={form.nickname || ''}
            onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} disabled={saving} placeholder="Ex: juca"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        {showCpf && (
          <div className="flex-1 min-w-[130px]">
            <label htmlFor="edit-athlete-cpf" className="block text-xs font-medium text-telemetry-text-primary mb-1">
              CPF{cpfRequired ? <span className="text-red-500"> *</span> : ' (opcional)'}
            </label>
            <input
              id="edit-athlete-cpf" type="text" required={cpfRequired} value={form.cpf}
              onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} disabled={saving} placeholder="000.000.000-00"
              className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
            />
          </div>
        )}

        <div className="w-full sm:w-24 shrink-0">
          <label htmlFor="edit-athlete-gender" className="block text-xs font-medium text-telemetry-text-primary mb-1">Sexo</label>
          <select
            id="edit-athlete-gender" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} disabled={saving}
            className="w-full px-2 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs"
          >
            <option value="">Sel.</option>
            <option value="MALE">Masc.</option>
            <option value="FEMALE">Fem.</option>
          </select>
        </div>

        <div className="shrink-0">
          <EditAthleteBirthDateField form={form} setForm={setForm} saving={saving} age={age} />
        </div>
      </div>

      {isMinorAthlete && (
        <EditAthleteGuardianFields
          form={form} setForm={setForm} saving={saving} immutable={guardianImmutable}
        />
      )}
    </div>
  );
}
