import type React from 'react';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import { getAutoCategoryForAge, hasCategories } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-logic.types';

export function toggleRankingEntry(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  type: RankingType
): void {
  setRankings((prev) => ({
    ...prev,
    [type]: {
      ...prev[type],
      enabled: !prev[type].enabled,
      category: '',
      class: '',
      position: '',
      juvenilePosition: '',
    },
  }));
}

export function updateRankingField(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  type: RankingType,
  field: keyof RankingState,
  value: string
): void {
  setRankings((prev) => {
    const updated = { ...prev[type], [field]: value };
    if (field === 'category') {
      updated.class = '';
      updated.juvenilePosition = '';
    }
    return { ...prev, [type]: updated };
  });
}

export function assignCategoryAutomatically(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  age: number | null
): void {
  if (age === null || age < 11) return;
  setRankings((prev) => {
    const updated = { ...prev };
    if (hasCategories('ESTADUAL')) {
      const autoCats = getAutoCategoryForAge('ESTADUAL', age);
      if (autoCats.length > 0 && updated.ESTADUAL.category === '') {
        updated.ESTADUAL = { ...updated.ESTADUAL, category: autoCats[0] };
      }
    }
    return updated;
  });
}
