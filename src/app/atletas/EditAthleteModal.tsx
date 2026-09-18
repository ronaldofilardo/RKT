'use client';

import { useEffect, useState } from 'react';
import {
  RankingType,
  calculateAgeFromYear,
  hasCategories,
  getAutoCategoryForAge,
} from '@/lib/ranking/rankingConstants';
import { RankingForm } from './RankingForm';
import { EditAthletePersonalFields } from './components/EditAthletePersonalFields';
import {
  RankingEntry,
  RankingState,
  createEmptyRankingState,
  athleteToRankingsState,
  rankingsStateToPayload,
} from './edit-athlete-modal.helpers';

interface EditAthleteModalProps {
  athlete: {
    id: string;
    name: string;
    gender?: string | null;
    age?: number | null;
    birthDate?: string | null;
    dominance?: string | null;
    backhand?: string | null;
    rankings?: Record<string, RankingEntry> | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    gender?: string;
    birthDate?: string;
    dominance?: string;
    backhand?: string;
    rankings?: Record<string, RankingEntry>;
  }) => Promise<void>;
}

export function EditAthleteModal({ athlete, isOpen, onClose, onSave }: EditAthleteModalProps) {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    dominance: '',
    backhand: '',
  });
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
    const birthDate = athlete.birthDate ? new Date(athlete.birthDate) : null;
    setForm({
      name: athlete.name || '',
      gender: athlete.gender || '',
      birthDay: birthDate ? String(birthDate.getUTCDate()).padStart(2, '0') : '',
      birthMonth: birthDate ? String(birthDate.getUTCMonth() + 1).padStart(2, '0') : '',
      birthYear: birthDate ? String(birthDate.getUTCFullYear()) : '',
      dominance: athlete.dominance || '',
      backhand: athlete.backhand || '',
    });
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
      const birthDate = form.birthYear && form.birthMonth && form.birthDay
        ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
        : undefined;

      await onSave({
        name: form.name.trim(),
        gender: form.gender || undefined,
        birthDate,
        dominance: form.dominance || undefined,
        backhand: form.backhand || undefined,
        rankings: rankingsStateToPayload(rankings),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !athlete) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Editar Atleta</h2>
            <p className="text-xs text-gray-600">{athlete.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <EditAthletePersonalFields form={form} setForm={setForm} saving={saving} />

          <RankingForm
            form={form}
            rankings={rankings}
            age={age}
            saving={saving}
            onRankingToggle={handleRankingToggle}
            onRankingFieldChange={handleRankingFieldChange}
          />
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}