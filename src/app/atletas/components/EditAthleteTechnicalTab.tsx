import React from 'react';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { AthleteForm } from '../types';
import type { RankingState } from '../edit-athlete-modal.logic';
import { RankingForm } from '../RankingForm';
import { EditAthleteClassCategorySection } from './EditAthleteClassCategorySection';

interface EditAthleteTechnicalTabProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  rankings: Record<RankingType, RankingState>;
  age: number | null;
  saving: boolean;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function EditAthleteTechnicalTab({
  form,
  setForm,
  rankings,
  age,
  saving,
  onRankingToggle,
  onRankingFieldChange,
}: EditAthleteTechnicalTabProps) {
  return (
    <div className="space-y-4">
      <EditAthleteClassCategorySection
        rankings={rankings}
        form={form}
        age={age}
        saving={saving}
        onRankingFieldChange={onRankingFieldChange}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-athlete-dominance" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Lateralidade / Dominância
          </label>
          <select
            id="edit-athlete-dominance"
            value={form.dominance}
            onChange={(e) => setForm((p) => ({ ...p, dominance: e.target.value }))}
            disabled={saving}
            className="w-full px-2.5 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs"
          >
            <option value="">Selecionar</option>
            <option value="RIGHT">Destro</option>
            <option value="LEFT">Canhoto</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-athlete-backhand" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Backhand
          </label>
          <select
            id="edit-athlete-backhand"
            value={form.backhand}
            onChange={(e) => setForm((p) => ({ ...p, backhand: e.target.value }))}
            disabled={saving}
            className="w-full px-2.5 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs"
          >
            <option value="">Selecionar</option>
            <option value="ONE_HANDED">1 mão</option>
            <option value="TWO_HANDED">2 mãos</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10">
        <RankingForm
          form={form}
          rankings={rankings}
          age={age}
          saving={saving}
          onRankingToggle={onRankingToggle}
          onRankingFieldChange={onRankingFieldChange}
        />
      </div>
    </div>
  );
}

