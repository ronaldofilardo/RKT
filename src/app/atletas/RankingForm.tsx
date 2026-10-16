'use client';

import { computeAvailableTypes } from './rankingLogic';
import type { RankingFormProps } from './ranking-form.types';
import { RankingTypeCard } from './ranking-form-card';

export function RankingForm({ form, rankings, age, saving, onRankingToggle, onRankingFieldChange, showHeader = true }: RankingFormProps) {
  const availableTypes = computeAvailableTypes(age, form.gender).filter((type) => type in rankings);

  return (
    <div>
      {showHeader && (
        <p className="block text-xs font-medium text-telemetry-text-primary mb-1">Ranking</p>
      )}
      <div className="space-y-2">
        {availableTypes.map((type) => (
          <RankingTypeCard
            key={type}
            type={type}
            state={rankings[type]}
            gender={form.gender}
            age={age}
            saving={saving}
            onToggle={onRankingToggle}
            onFieldChange={onRankingFieldChange}
          />
        ))}
      </div>
    </div>
  );
}
