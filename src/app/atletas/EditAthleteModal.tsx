import { useEffect, useState } from 'react';
import { RankingType, calculateAgeFromYear, hasCategories, getAutoCategoryForAge } from '@/lib/ranking/rankingConstants';
import { EditAthleteModalView } from './EditAthleteModal.view';
import type { AthleteFormState, EditAthleteModalProps, RankingEntry, RankingState, RankingsState } from './edit-athlete-modal.types';
import { buildAthleteSaveData, getSaveError } from './EditAthleteModal.save.helpers';

const emptyForm: AthleteFormState = { name: '', gender: '', birthDay: '', birthMonth: '', birthYear: '', dominance: '', backhand: '' };
const rankingTypes: RankingType[] = ['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA'];
const emptyRankings = (): RankingsState => Object.fromEntries(rankingTypes.map((type) => [type, emptyRanking()])) as RankingsState;
const emptyRanking = (): RankingState => ({ enabled: false, category: '', class: '', position: '', juvenilePosition: '' });

function athleteToRankingsState(rankings: Record<string, RankingEntry> | null | undefined): RankingsState {
  const state = emptyRankings();
  if (!rankings) return state;
  for (const [type, entry] of Object.entries(rankings)) {
    if (!(type in state)) continue;
    state[type as RankingType] = { enabled: true, category: entry.category || '', class: entry.class || '', position: String(entry.position || ''), juvenilePosition: entry.juvenilePosition ? String(entry.juvenilePosition) : '' };
  }
  return state;
}

export function EditAthleteModal({ athlete, isOpen, onClose, onSave }: EditAthleteModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [rankings, setRankings] = useState<RankingsState>(emptyRankings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const age = calculateAgeFromYear(parseInt(form.birthYear, 10) || 0);

  useEffect(() => {
    if (!athlete) return;
    const birthDate = athlete.birthDate ? new Date(athlete.birthDate) : null;
    setForm({ name: athlete.name || '', gender: athlete.gender || '', birthDay: birthDate ? String(birthDate.getUTCDate()).padStart(2, '0') : '', birthMonth: birthDate ? String(birthDate.getUTCMonth() + 1).padStart(2, '0') : '', birthYear: birthDate ? String(birthDate.getUTCFullYear()) : '', dominance: athlete.dominance || '', backhand: athlete.backhand || '' });
    setRankings(athleteToRankingsState(athlete.rankings));
    setError(null);
  }, [athlete]);

  useEffect(() => {
    if (age < 11 || !hasCategories('ESTADUAL')) return;
    setRankings((prev) => {
      const categories = getAutoCategoryForAge('ESTADUAL', age);
      if (categories.length === 0 || prev.ESTADUAL.category !== '') return prev;
      return { ...prev, ESTADUAL: { ...prev.ESTADUAL, category: categories[0] } };
    });
  }, [age]);

  const updateField = (field: keyof AthleteFormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleRanking = (type: RankingType) => setRankings((prev) => ({ ...prev, [type]: { ...prev[type], enabled: !prev[type].enabled, category: '', class: '', position: '', juvenilePosition: '' } }));
  const updateRanking = (type: RankingType, field: keyof RankingState, value: string) => setRankings((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value, ...(field === 'category' ? { class: '', juvenilePosition: '' } : {}) } }));

  const save = async () => {
    if (!athlete || !form.name.trim()) return;
    setSaving(true); setError(null);
    try {
      await onSave(buildAthleteSaveData(form, rankings));
    } catch (err) { setError(getSaveError(err)); } finally { setSaving(false); }
  };

  if (!isOpen || !athlete) return null;
  return <EditAthleteModalView athleteName={athlete.name} form={form} rankings={rankings} age={age} saving={saving} error={error} onClose={onClose} onSave={save} onFieldChange={updateField} onRankingToggle={toggleRanking} onRankingFieldChange={updateRanking} />;
}
