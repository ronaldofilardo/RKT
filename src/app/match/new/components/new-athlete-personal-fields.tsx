import type { AthleteForm } from '@/app/atletas/types';
import { fieldIds, type NewAthleteModalFormProps } from './new-athlete-modal-form.types';
import { BirthDateFields } from './new-athlete-birth-input';

type NewAthletePersonalFieldsProps = Pick<
  NewAthleteModalFormProps,
  'form' | 'setForm' | 'submitting' | 'nameInputRef' | 'age' | 'nickname' | 'onNicknameChange'
>;

export function NewAthletePersonalFields({
  form,
  setForm,
  submitting,
  nameInputRef,
  age,
  nickname,
  onNicknameChange,
}: NewAthletePersonalFieldsProps) {
  const updateFieldValue = (field: keyof AthleteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={fieldIds.name} className="block text-xs font-medium text-telemetry-text-primary mb-1">
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
            className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-sm"
          />
        </div>

        <div>
          <label htmlFor="new-athlete-nickname" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Apelido (nickname) <span className="text-telemetry-text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="new-athlete-nickname"
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            disabled={submitting}
            placeholder="Ex: joao.silva"
            maxLength={30}
            className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="w-full sm:w-28 shrink-0">
          <label htmlFor={fieldIds.gender} className="block text-xs font-medium text-telemetry-text-primary mb-1">Sexo</label>
          <select
            id={fieldIds.gender}
            value={form.gender}
            onChange={(e) => updateFieldValue('gender', e.target.value)}
            disabled={submitting}
            className="w-full px-2 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs"
          >
            <option value="" className="text-telemetry-text-primary">Sel.</option>
            <option value="MALE" className="text-telemetry-text-primary">Masc.</option>
            <option value="FEMALE" className="text-telemetry-text-primary">Fem.</option>
          </select>
        </div>

        <div className="shrink-0">
          <span className="block text-xs font-medium text-telemetry-text-primary mb-1">Data de Nascimento</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <BirthDateFields form={form} submitting={submitting} onChange={updateFieldValue} />
            {age !== null && (
              <span className="text-xs text-telemetry-text-primary ml-1 whitespace-nowrap">
                Idade: <span className="font-semibold text-telemetry-volt">{age} anos</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
