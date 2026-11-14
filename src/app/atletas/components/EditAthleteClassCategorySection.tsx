import React from 'react';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import {
  getMatchCategoriesForAge,
  MATCH_CATEGORY_LABELS,
  MATCH_CATEGORY_AGE_LABELS,
} from '@/lib/ranking/rankingConstants';
import { computeClassesForType } from '../rankingLogic';
import type { AthleteForm } from '../types';
import type { RankingState } from '../edit-athlete-modal.logic';

interface EditAthleteClassCategorySectionProps {
  rankings: Record<RankingType, RankingState>;
  form: AthleteForm;
  age: number | null;
  saving: boolean;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function EditAthleteClassCategorySection({
  rankings,
  form,
  age,
  saving,
  onRankingFieldChange,
}: EditAthleteClassCategorySectionProps) {
  if (rankings.ESTADUAL.enabled && age !== null && age >= 11 && age <= 90) return null;

  const isDisabled = saving || age === null || !form.gender || age < 11 || age > 90;
  const classes = (age !== null && form.gender && age >= 11 && age <= 90)
    ? computeClassesForType(rankings.ESTADUAL.category, form.gender, age)
    : [];

  return (
    <div className="grid grid-cols-4 gap-3 items-start">
      <div className="col-span-1">
        <label htmlFor="edit-athlete-class" className="block text-xs font-medium text-telemetry-text-primary mb-1">
          Classe
        </label>
        <select
          id="edit-athlete-class"
          value={rankings.ESTADUAL.class}
          onChange={(e) => onRankingFieldChange('ESTADUAL', 'class', e.target.value)}
          disabled={isDisabled}
          className="w-full px-2.5 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs disabled:opacity-50"
        >
          <option value="">{isDisabled ? 'Aguardando...' : 'Selecione...'}</option>
          {classes.map((cls) => (
            <option key={cls} value={cls} className="text-telemetry-text-primary">
              {cls}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-3">
        <div className="bg-telemetry-blue/10 border border-telemetry-blue/20 rounded-xl p-3 h-full">
          <h3 className="text-xs font-semibold text-telemetry-text-primary mb-1.5">Categoria por idade</h3>
          {age === null ? (
            <p className="text-xs text-telemetry-text-muted italic">
              Preencha a data de nascimento para identificar a categoria.
            </p>
          ) : age < 11 || age > 90 ? (
            <p className="text-xs text-telemetry-text-muted italic">
              Sem categoria etária disponível para a idade atual ({age} anos).
            </p>
          ) : (
            <div className="space-y-1">
              {getMatchCategoriesForAge(age).map((category) => (
                <div key={category} className="flex items-center text-xs">
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
