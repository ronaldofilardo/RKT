import type { AthleteForm } from '@/app/atletas/types';
import { fieldIds, type NewAthleteModalFormProps } from './new-athlete-modal-form.types';
import { BirthDateFields } from './new-athlete-birth-input';

type NewAthletePersonalFieldsProps = Pick<
  NewAthleteModalFormProps,
  'form' | 'setForm' | 'submitting' | 'nameInputRef' | 'age'
>;

export function NewAthletePersonalFields({
  form,
  setForm,
  submitting,
  nameInputRef,
  age,
}: NewAthletePersonalFieldsProps) {
  const updateFieldValue = (field: keyof AthleteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div>
        <label htmlFor={fieldIds.name} className="block text-sm font-medium text-telemetry-text-primary mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          ref={nameInputRef}
          id={fieldIds.name}
          type="text"
          value={form.name}
          onChange={(e) => updateFieldValue('name', e.target.value)}
          disabled={submitting}
          placeholder="Ex: João Silva"
          className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <label htmlFor={fieldIds.gender} className="block text-sm font-medium text-telemetry-text-primary mb-1">Sexo</label>
          <select
            id={fieldIds.gender}
            value={form.gender}
            onChange={(e) => updateFieldValue('gender', e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
          >
            <option value="" className="text-telemetry-text-primary">Selecione...</option>
            <option value="MALE" className="text-telemetry-text-primary">Masculino</option>
            <option value="FEMALE" className="text-telemetry-text-primary">Feminino</option>
          </select>
        </div>

        <div className="col-span-3">
          <span className="block text-sm font-medium text-telemetry-text-primary mb-1">Data de Nascimento</span>
          <BirthDateFields form={form} submitting={submitting} onChange={updateFieldValue} />
          <div className="mt-1.5 flex justify-between items-center">
            <span className="text-xs text-telemetry-text-muted">Ex: 15 / 03 / 1995</span>
            {age !== null && (
              <span className="text-xs text-telemetry-text-primary">Idade: <span className="font-semibold">{age} anos</span></span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
