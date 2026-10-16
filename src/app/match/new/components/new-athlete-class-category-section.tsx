import { computeClassesForType } from '@/app/atletas/rankingLogic';
import { getMatchCategoriesForAge, MATCH_CATEGORY_LABELS, MATCH_CATEGORY_AGE_LABELS } from '@/lib/ranking/rankingConstants';
import { fieldIds, type NewAthleteModalFormProps } from './new-athlete-modal-form.types';

type NewAthleteClassCategorySectionProps = Pick<
  NewAthleteModalFormProps,
  'rankings' | 'form' | 'age' | 'submitting' | 'onRankingFieldChange'
>;

export function NewAthleteClassCategorySection({
  rankings,
  form,
  age,
  submitting,
  onRankingFieldChange,
}: NewAthleteClassCategorySectionProps) {
  if (rankings.ESTADUAL.enabled && age !== null && age >= 11 && age <= 90) return null;

  return (
    <div className="grid grid-cols-4 gap-4 items-start">
      <div className="col-span-1">
        <label htmlFor={fieldIds.class} className="block text-sm font-medium text-telemetry-text-primary mb-1">Classe</label>
        <select
          id={fieldIds.class}
          value={rankings.ESTADUAL.class}
          onChange={(e) => onRankingFieldChange('ESTADUAL', 'class', e.target.value)}
          disabled={submitting || age === null || !form.gender || age < 11 || age > 90}
          className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary disabled:bg-white/5 disabled:text-telemetry-text-muted"
        >
          <option value="">{(age === null || !form.gender) ? 'Aguardando...' : 'Selecione...'}</option>
          {age !== null && form.gender && age >= 11 && age <= 90 && computeClassesForType(rankings.ESTADUAL.category, form.gender, age).map((cls) => (
            <option key={cls} value={cls} className="text-telemetry-text-primary">{cls}</option>
          ))}
        </select>
      </div>
      <div className="col-span-3">
        <div className="bg-telemetry-blue/10 border border-telemetry-blue/20 rounded-xl p-4 h-full">
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">Categoria por idade</h3>
        {age === null || !form.gender ? (
          <p className="text-xs text-telemetry-text-muted italic">Preencha sexo e data de nascimento para identificar a categoria.</p>
        ) : age < 11 || age > 90 ? (
          <p className="text-xs text-telemetry-text-muted italic">Sem categoria etária disponível para a idade atual ({age} anos).</p>
        ) : (
          <div className="space-y-1.5">
            {getMatchCategoriesForAge(age).map((category) => (
              <div key={category} className="flex items-center text-sm">
                <span className="font-medium text-telemetry-text-primary">{MATCH_CATEGORY_LABELS[category]}</span>
                <span className="text-telemetry-blue px-2">·</span>
                <span className="text-telemetry-text-primary">{MATCH_CATEGORY_AGE_LABELS[category]}</span>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
