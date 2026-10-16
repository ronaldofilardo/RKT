import { RankingForm } from '@/app/atletas/RankingForm';
import { type NewAthleteModalFormProps } from './new-athlete-modal-form.types';
import { NewAthletePersonalFields } from './new-athlete-personal-fields';
import { NewAthleteClassCategorySection } from './new-athlete-class-category-section';
import { NewAthleteSkillsSection } from './new-athlete-skills-section';

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

        <NewAthleteClassCategorySection
          rankings={rankings}
          form={form}
          age={age}
          submitting={submitting}
          onRankingFieldChange={onRankingFieldChange}
        />

        <NewAthleteSkillsSection form={form} setForm={setForm} submitting={submitting} />
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
