import { RankingForm } from '@/app/atletas/RankingForm';
import { AthleteOriginSection } from '@/components/athlete/AthleteOriginSection';
import { type NewAthleteModalFormProps } from './new-athlete-modal-form.types';
import { NewAthletePersonalFields } from './new-athlete-personal-fields';
import { NewAthleteClassCategorySection } from './new-athlete-class-category-section';
import { NewAthleteSkillsSection } from './new-athlete-skills-section';

export function NewAthleteModalForm({
  form,
  setForm,
  nickname,
  onNicknameChange,
  rankings,
  age,
  submitting,
  nameInputRef,
  myClub = false,
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

        <div>
          <label htmlFor="new-athlete-nickname" className="block text-sm font-medium text-telemetry-text-primary mb-1">
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
            className="w-full px-3 py-2 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
          />
          <p className="mt-1 text-xs text-telemetry-text-muted">
            Usado no pool público quando o atleta autoriza a visibilidade. Não é o nome oficial.
          </p>
        </div>

        <AthleteOriginSection
          uf={(form.uf || null) as import('@/core/athlete/brazilian-states').BrazilianUF | null}
          city={form.city || null}
          club={form.club || null}
          readOnly={myClub}
          onChange={({ uf, city, club }) => {
            setForm((prev) => ({ ...prev, uf: uf ?? '', city: city ?? '', club: club ?? '' }));
          }}
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
