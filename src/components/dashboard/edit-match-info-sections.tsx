'use client';

import { FormField, SelectField, TextInput } from './edit-match-info-fields';
import { ROUND_OPTIONS } from '@/app/match/new/matchConstants';
import { SECTION_TITLE_CLASS, GRID_2, type SectionProps } from './edit-match-info-section-shared';

export type { Change, SectionProps } from './edit-match-info-section-shared';
export { SECTION_TITLE_CLASS } from './edit-match-info-section-shared';
export { DateTimeSection, DetailsSection, FormFooter } from './edit-match-info-extra-sections';

export function TournamentSection({ values, onChange }: SectionProps) {
  const matchingOption = ROUND_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === (values.round || '').toLowerCase()
  );
  const isCustomRound = Boolean(
    values.round && !matchingOption && !ROUND_OPTIONS.some((opt) => opt.value === values.round)
  );

  return (
    <div>
      <h3 className={SECTION_TITLE_CLASS}>Torneio</h3>
      <div className="space-y-3">
        <FormField htmlFor="edit-tournament" label="Nome do Torneio">
          <TextInput id="edit-tournament" value={values.tournamentName} placeholder="Ex: Torneio Aberto" onChange={(v) => onChange('tournamentName', v)} />
        </FormField>
        <div className={GRID_2}>
          <FormField htmlFor="edit-club" label="Clube" hint="(opcional)">
            <TextInput id="edit-club" value={values.clubName} placeholder="Nome do clube" onChange={(v) => onChange('clubName', v)} />
          </FormField>
          <FormField htmlFor="edit-round" label="Rodada">
            <SelectField
              id="edit-round"
              value={matchingOption ? matchingOption.value : values.round}
              onChange={(v) => onChange('round', v)}
            >
              <option value="">Selecione a rodada</option>
              {isCustomRound && (
                <option value={values.round}>
                  {values.round}
                </option>
              )}
              {ROUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
      </div>
    </div>
  );
}
