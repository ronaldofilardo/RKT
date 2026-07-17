'use client';

import { useState, useMemo } from 'react';
import { Athlete } from '../page';
import {
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  RankingType,
  calculateAgeFromYear,
  hasCategories,
  hasClasses,
  getCategoriesForAge,
  getClassesForSelection,
} from '../rankingConstants';

interface NewAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
}

interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
}

function createEmptyRankingState(): RankingState {
  return { enabled: false, category: '', class: '', position: '' };
}

export function NewAthleteModal({ isOpen, onClose, onCreated }: NewAthleteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    ATP: createEmptyRankingState(),
    WTA: createEmptyRankingState(),
  });

  const age = useMemo(() => {
    const y = parseInt(form.birthYear);
    return isNaN(y) ? null : calculateAgeFromYear(y);
  }, [form.birthYear]);

  const availableTypes = useMemo(() => {
    if (age === null) return RANKING_TYPES;
    return RANKING_TYPES.filter((type) => {
      if (!hasCategories(type)) return true;
      return getCategoriesForAge(type, age).length > 0;
    });
  }, [age]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRankingToggle = (type: RankingType) => {
    setRankings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled,
        category: '',
        class: '',
        position: '',
      },
    }));
  };

  const handleRankingFieldChange = (type: RankingType, field: keyof RankingState, value: string) => {
    setRankings((prev) => {
      const updated = { ...prev[type], [field]: value };
      if (field === 'category') {
        updated.class = '';
      }
      return { ...prev, [type]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');

      const rankingsPayload: Record<string, { category?: string; class?: string; position: number }> = {};
      for (const [type, state] of Object.entries(rankings) as [RankingType, RankingState][]) {
        if (state.enabled && state.position) {
          const entry: { category?: string; class?: string; position: number } = {
            position: parseInt(state.position),
          };
          if (state.category) entry.category = state.category;
          if (state.class) entry.class = state.class;
          rankingsPayload[type] = entry;
        }
      }

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          gender: form.gender || undefined,
          birthDate:
            form.birthYear && form.birthMonth && form.birthDay
              ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
              : undefined,
          dominance: form.dominance || undefined,
          backhand: form.backhand || undefined,
          rankings: Object.keys(rankingsPayload).length > 0 ? rankingsPayload : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar atleta');
      }

      const player = await res.json();

      onCreated({
        id: player.id,
        name: player.name,
        gender: player.gender,
        age: player.age,
        dominance: player.dominance,
        backhand: player.backhand,
        ranking: player.ranking,
      });

      setForm({
        name: '',
        gender: '',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        dominance: '',
        backhand: '',
      });
      setRankings({
        ESTADUAL: createEmptyRankingState(),
        CBT: createEmptyRankingState(),
        COSAT: createEmptyRankingState(),
        ITF: createEmptyRankingState(),
        ATP: createEmptyRankingState(),
        WTA: createEmptyRankingState(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRankingRow = (type: RankingType) => {
    const state = rankings[type];
    const showCategory = hasCategories(type) && age !== null;
    const showClass = hasClasses(type) && state.category !== '' && form.gender !== '';
    const showPosition = state.enabled;

    const categories = age !== null ? getCategoriesForAge(type, age) : [];
    const classes =
      state.category && form.gender && age !== null
        ? getClassesForSelection(state.category, form.gender, age)
        : [];

    return (
      <div key={type} className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id={`ranking-${type}`}
            checked={state.enabled}
            onChange={() => handleRankingToggle(type)}
            disabled={submitting}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor={`ranking-${type}`} className="text-sm font-medium text-gray-700">
            {RANKING_TYPE_LABELS[type]}
          </label>
        </div>

        {state.enabled && (
          <div className="ml-6 space-y-2">
            {showCategory && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  value={state.category}
                  onChange={(e) => handleRankingFieldChange(type, 'category', e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="text-gray-900">
                      {cat} anos
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showClass && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Classe</label>
                <select
                  value={state.class}
                  onChange={(e) => handleRankingFieldChange(type, 'class', e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls} className="text-gray-900">
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Posição</label>
              <input
                type="number"
                min="1"
                value={state.position}
                onChange={(e) => handleRankingFieldChange(type, 'position', e.target.value)}
                disabled={submitting}
                placeholder="Posição"
                className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Atleta</h2>
            <p className="text-xs text-gray-500">Preencha os dados do jogador</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={submitting}
              autoFocus
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">
                  Selecione...
                </option>
                <option value="MALE" className="text-gray-900">
                  Masculino
                </option>
                <option value="FEMALE" className="text-gray-900">
                  Feminino
                </option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <div className="flex items-end gap-3">
                <div className="w-28">
                  <label className="sr-only">Dia</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.birthDay}
                    onChange={(e) => handleChange('birthDay', e.target.value)}
                    disabled={submitting}
                    placeholder="DD"
                    maxLength={2}
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-base"
                  />
                </div>
                <span className="text-gray-400 text-xl font-medium mb-2.5">/</span>
                <div className="w-28">
                  <label className="sr-only">Mês</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.birthMonth}
                    onChange={(e) => handleChange('birthMonth', e.target.value)}
                    disabled={submitting}
                    placeholder="MM"
                    maxLength={2}
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-base"
                  />
                </div>
                <span className="text-gray-400 text-xl font-medium mb-2.5">/</span>
                <div className="w-36">
                  <label className="sr-only">Ano</label>
                  <input
                    type="number"
                    min="1900"
                    max="2030"
                    value={form.birthYear}
                    onChange={(e) => handleChange('birthYear', e.target.value)}
                    disabled={submitting}
                    placeholder="AAAA"
                    maxLength={4}
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-base"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">Ex: 15 / 03 / 1995</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dominância</label>
              <select
                value={form.dominance}
                onChange={(e) => handleChange('dominance', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">
                  Selecione...
                </option>
                <option value="RIGHT" className="text-gray-900">
                  Destro
                </option>
                <option value="LEFT" className="text-gray-900">
                  Canhoto
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backhand</label>
              <select
                value={form.backhand}
                onChange={(e) => handleChange('backhand', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">
                  Selecione...
                </option>
                <option value="ONE_HANDED" className="text-gray-900">
                  Uma mão
                </option>
                <option value="TWO_HANDED" className="text-gray-900">
                  Duas mãos
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ranking</label>
            {age !== null && (
              <p className="text-xs text-gray-500 mb-2">Idade: {age} anos</p>
            )}
            <div className="space-y-2">
              {availableTypes.map((type) => renderRankingRow(type))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
