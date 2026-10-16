import type { AthleteForm } from '@/app/atletas/types';
import { fieldIds, type NewAthleteModalFormProps } from './new-athlete-modal-form.types';

type NewAthleteSkillsSectionProps = Pick<NewAthleteModalFormProps, 'form' | 'setForm' | 'submitting'>;

export function NewAthleteSkillsSection({ form, setForm, submitting }: NewAthleteSkillsSectionProps) {
  const updateFieldValue = (field: keyof AthleteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor={fieldIds.dominance} className="block text-sm font-medium text-telemetry-text-primary mb-1">Dominância</label>
        <select
          id={fieldIds.dominance}
          value={form.dominance}
          onChange={(e) => updateFieldValue('dominance', e.target.value)}
          disabled={submitting}
          className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
        >
          <option value="" className="text-telemetry-text-primary">Selecione...</option>
          <option value="RIGHT" className="text-telemetry-text-primary">Destro</option>
          <option value="LEFT" className="text-telemetry-text-primary">Canhoto</option>
        </select>
      </div>

      <div>
        <label htmlFor={fieldIds.backhand} className="block text-sm font-medium text-telemetry-text-primary mb-1">Backhand</label>
        <select
          id={fieldIds.backhand}
          value={form.backhand}
          onChange={(e) => updateFieldValue('backhand', e.target.value)}
          disabled={submitting}
          className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
        >
          <option value="" className="text-telemetry-text-primary">Selecione...</option>
          <option value="ONE_HANDED" className="text-telemetry-text-primary">Uma mão</option>
          <option value="TWO_HANDED" className="text-telemetry-text-primary">Duas mãos</option>
        </select>
      </div>
    </div>
  );
}
