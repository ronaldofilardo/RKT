import { RankingForm } from '@/app/atletas/RankingForm';
import { computeClassesForType } from '@/app/atletas/rankingLogic';
import { getMatchCategoriesForAge, MATCH_CATEGORY_LABELS, MATCH_CATEGORY_AGE_LABELS } from '@/lib/ranking/rankingConstants';
import type { AthleteForm } from '@/app/atletas/types';
import { fieldIds, type NewAthleteModalFormProps } from './new-athlete-modal-form.types';
import { NewAthletePersonalFields } from './new-athlete-personal-fields';

export function NewAthleteModalForm({
  form,
  setForm,
  rankings,
  age,
  submitting,
  nameInputRef,
  onRankingToggle,
  onRankingFieldChange
}: NewAthleteModalFormProps) {
  const handleChange = (field: keyof AthleteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <section aria-labelledby="new-athlete-cadastro-title" className="space-y-4 rounded-xl border border-white/10 p-4">
        <h3 id="new-athlete-cadastro-title" className="text-base font-semibold text-telemetry-text-primary">1. Cadastro</h3>

        <NewAthletePersonalFields
          form={form}
          setForm={setForm}
          submitting={submitting}
          nameInputRef={nameInputRef}
          age={age}
        />

        {(!rankings.ESTADUAL.enabled || age === null || age < 11 || age > 90) && (
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
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={fieldIds.dominance} className="block text-sm font-medium text-telemetry-text-primary mb-1">Dominância</label>
            <select
              id={fieldIds.dominance}
              value={form.dominance}
              onChange={(e) => handleChange('dominance', e.target.value)}
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
              onChange={(e) => handleChange('backhand', e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
            >
              <option value="" className="text-telemetry-text-primary">Selecione...</option>
              <option value="ONE_HANDED" className="text-telemetry-text-primary">Uma mão</option>
              <option value="TWO_HANDED" className="text-telemetry-text-primary">Duas mãos</option>
            </select>
          </div>
        </div>

      </section>

      <section aria-labelledby="new-athlete-ranking-title" className="space-y-4 rounded-xl border border-white/10 p-4">
        <div>
          <h3 id="new-athlete-ranking-title" aria-label="2. Ranking" className="text-base font-semibold text-telemetry-text-primary">
            2. Ranking
          </h3>
          <p className="text-sm text-telemetry-text-muted">Opções de autoranking</p>
        </div>
        <RankingForm
          showHeader={false}
          form={{ gender: form.gender }}
          rankings={rankings}
          age={age}
          saving={submitting}
          onRankingToggle={onRankingToggle}
          onRankingFieldChange={onRankingFieldChange}
        />
      </section>
    </div>
  );
}
