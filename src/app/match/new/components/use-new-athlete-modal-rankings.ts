'use client';

import { useEffect } from 'react';
import { useAge } from '../hooks/useAge';
import { assignCategoryAutomatically, type RankingState } from '@/app/atletas/rankingLogic';
import type { RankingType } from '@/lib/ranking/rankingConstants';

export function useNewAthleteModalRankings({
  form,
  setRankings,
}: {
  form: { birthYear: string; birthMonth: string; birthDay: string };
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>;
}) {
  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);

  useEffect(() => {
    assignCategoryAutomatically(setRankings, age);
  }, [age, setRankings]);

  return { age };
}