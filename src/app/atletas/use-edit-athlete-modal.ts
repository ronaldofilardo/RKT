import { useEffect, useState } from 'react';
import {
  RankingType,
  calculateAgeFromYear,
  hasCategories,
  getAutoCategoryForAge,
} from '@/lib/ranking/rankingConstants';
import { EMPTY_ATHLETE_FORM, type AthleteForm } from './types';
import {
  createEmptyRankingState,
  athleteToRankingsState,
  type RankingState,
} from './edit-athlete-modal.logic';
import type { EditAthleteModalProps, EditAthleteSavePayload } from './edit-athlete-modal.types';
import { buildFormFromAthlete, buildSavePayload } from './edit-athlete-modal.submission';

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
    setForm(buildFormFromAthlete(athlete));
    setRankings(athleteToRankingsState(athlete.rankings));
    setError(null);
  }, [athlete]);

  const age = calculateAgeFromYear(parseInt(form.birthYear) || 0);

  useEffect(() => {
    if (age < 11) return;
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
  }, [age]);

  const handleRankingToggle = (type: RankingType) => {
    setRankings((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled, category: '', class: '', position: '', juvenilePosition: '' },
    }));
  };

  const handleRankingFieldChange = (type: RankingType, field: keyof RankingState, value: string) => {
    setRankings((prev) => {
      const updated = { ...prev[type], [field]: value };
      if (field === 'category') {
        updated.class = '';
        updated.juvenilePosition = '';
      }
      return { ...prev, [type]: updated };
    });
  };

  const handleSave = async () => {
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
    handleRankingToggle, handleRankingFieldChange, handleSave,
  };
}
