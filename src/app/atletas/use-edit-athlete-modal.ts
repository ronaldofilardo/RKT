import { useEffect, useState, useMemo } from 'react';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import { EMPTY_ATHLETE_FORM, type AthleteForm } from './types';
import {
  createEmptyRankingState,
  athleteToRankingsState,
  type RankingState,
} from './edit-athlete-modal.logic';
import type { EditAthleteModalProps, EditAthleteSavePayload } from './edit-athlete-modal.types';
import { buildFormFromAthlete, buildSavePayload } from './edit-athlete-modal.submission';
import { calculateEffectiveAge, syncRankingsWithAgeAndGender } from './ranking-sync.logic';

interface UseEditAthleteModalParams {
  athlete: EditAthleteModalProps['athlete'];
  onSave: (data: EditAthleteSavePayload) => Promise<void>;
}

export function useEditAthleteModal({ athlete, onSave }: UseEditAthleteModalParams) {
  const [form, setForm] = useState<AthleteForm>(EMPTY_ATHLETE_FORM);
  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>({
    ESTADUAL: createEmptyRankingState(),
    CBT: createEmptyRankingState(),
    COSAT: createEmptyRankingState(),
    ITF: createEmptyRankingState(),
    ITF_Juniors: createEmptyRankingState(),
    ATP: createEmptyRankingState(),
    WTA: createEmptyRankingState(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athlete) return;
    const initialForm = buildFormFromAthlete(athlete);
    setForm(initialForm);
    const initialAge = calculateEffectiveAge(initialForm.birthYear, athlete.age);
    const initialRankings = athleteToRankingsState(athlete.rankings);
    setRankings(syncRankingsWithAgeAndGender(initialRankings, initialAge, initialForm.gender));
    setError(null);
  }, [athlete]);

  const age = useMemo(
    () => calculateEffectiveAge(form.birthYear, athlete?.age),
    [form.birthYear, athlete?.age]
  );

  useEffect(() => {
    setRankings((prev) => syncRankingsWithAgeAndGender(prev, age, form.gender));
  }, [age, form.gender]);

  const toggleRankingEntry = (type: RankingType) => {
    setRankings((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled, category: '', class: '', position: '', juvenilePosition: '' },
    }));
  };

  const updateRankingField = (type: RankingType, field: keyof RankingState, value: string) => {
    setRankings((prev) => {
      const updated = { ...prev[type], [field]: value };
      if (field === 'category') {
        updated.class = '';
        updated.juvenilePosition = '';
      }
      return { ...prev, [type]: updated };
    });
  };

  const saveEditedAthlete = async () => {
    if (!athlete || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(buildSavePayload(form, rankings));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return {
    form, setForm, rankings, age, saving, error,
    toggleRankingEntry, updateRankingField, saveEditedAthlete,
  };
}
