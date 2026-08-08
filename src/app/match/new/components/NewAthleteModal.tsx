'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Athlete } from '../types';
import {
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  RankingType,
  hasCategories,
  hasClasses,
  getCategoriesForAge,
  getAllowedCategoriesForAge,
  getAutoCategoryForAge,
  getClassesForSelection,
} from '../rankingConstants';
import { useAge } from '../hooks/useAge';

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
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fieldIds = {
    name: 'new-athlete-name',
    gender: 'new-athlete-gender',
    birthDay: 'new-athlete-birth-day',
    birthMonth: 'new-athlete-birth-month',
    birthYear: 'new-athlete-birth-year',
    class: 'new-athlete-class',
    dominance: 'new-athlete-dominance',
    backhand: 'new-athlete-backhand',
  };

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);

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

  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);

  const availableTypes = useMemo(() => {
    if (age === null) return RANKING_TYPES;
    return RANKING_TYPES.filter((type) => {
      if (type === 'ATP' || type === 'WTA') return age <= 40;
      if (!hasCategories(type)) return true;
      return getCategoriesForAge(type, age).length > 0;
    });
  }, [age]);

  useEffect(() => {
    if (age === null || age < 11) return;
    setRankings((prev) => {
      const updated = { ...prev };
      for (const type of Object.keys(updated) as RankingType[]) {
        if (type === 'ESTADUAL' && hasCategories(type)) {
          const autoCats = getAutoCategoryForAge(type, age);
          if (autoCats.length > 0 && updated[type].category === '') {
            updated[type] = { ...updated[type], category: autoCats[0] };
          }
        }
      }
      return updated;
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

      const json = await res.json();
      const player = json?.data || json;

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
    const showCategory = hasCategories(type) && age !== null && age < 19;
    const showClass = hasClasses(type) && state.enabled && form.gender !== '' && age !== null && age >= 11;

    const categories = age !== null
      ? (type === 'ESTADUAL' ? getAutoCategoryForAge(type, age) : getAllowedCategoriesForAge(type, age))
      : [];
    const classes =
      state.category && form.gender && age !== null
        ? getClassesForSelection(state.category, form.gender, age)
        : [];

    return (
      <div key={type} className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id={`new-ranking-${type}`}
            checked={state.enabled}
            onChange={() => handleRankingToggle(type)}
            disabled={submitting}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor={`new-ranking-${type}`} className="text-sm font-medium text-gray-700">
            {RANKING_TYPE_LABELS[type]}
          </label>
          {state.enabled && (
            <button
              type="button"
              onClick={() => handleRankingToggle(type)}
              disabled={submitting}
              className="ml-auto text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
              title="Remover este ranking"
            >
              Remover
            </button>
          )}
        </div>

        {state.enabled && (
          <div className="ml-6 space-y-2">
            {showCategory && (
              <div>
                <label htmlFor={`new-ranking-${type}-category`} className="block text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  id={`new-ranking-${type}-category`}
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
                <label htmlFor={`new-ranking-${type}-class`} className="block text-xs text-gray-500 mb-1">Classe</label>
                <select
                  id={`new-ranking-${type}-class`}
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
              <label htmlFor={`new-ranking-${type}-position`} className="block text-xs text-gray-500 mb-1">Posição</label>
              <input
                id={`new-ranking-${type}-position`}
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />
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
            <label htmlFor={fieldIds.name} className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              id={fieldIds.name}
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={submitting}
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label htmlFor={fieldIds.gender} className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                id={fieldIds.gender}
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
              <span className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</span>
              <div className="flex items-end gap-3">
                <div className="w-28">
                  <label htmlFor={fieldIds.birthDay} className="sr-only">Dia</label>
                  <input
                    id={fieldIds.birthDay}
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
                  <label htmlFor={fieldIds.birthMonth} className="sr-only">Mês</label>
                  <input
                    id={fieldIds.birthMonth}
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
                  <label htmlFor={fieldIds.birthYear} className="sr-only">Ano</label>
                  <input
                    id={fieldIds.birthYear}
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

          <div className="grid grid-cols-4 gap-4 items-start">
            <div className="col-span-1">
              <label htmlFor={fieldIds.class} className="block text-sm font-medium text-gray-700 mb-1">
                Classe {rankings.ESTADUAL.enabled && <span className="text-red-500">*</span>}
              </label>
              <select
                id={fieldIds.class}
                value={rankings.ESTADUAL.class}
                onChange={(e) => handleRankingFieldChange('ESTADUAL', 'class', e.target.value)}
                disabled={submitting || age === null || !form.gender || age < 11 || age > 90}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {(age === null || !form.gender) ? 'Aguardando...' : 'Selecione...'}
                </option>
                {age !== null && form.gender && age >= 11 && age <= 90 && getClassesForSelection('', form.gender, age).map((cls) => (
                  <option key={cls} value={cls} className="text-gray-900">
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-3">
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 h-full">
                <h3 className="text-sm font-semibold text-sky-900 mb-2">Categorias</h3>
                {age === null || !form.gender ? (
                  <p className="text-xs text-sky-700/70 italic">Preencha sexo e data de nascimento para ver as categorias.</p>
                ) : age < 11 || age > 90 ? (
                  <p className="text-xs text-sky-700/70 italic">Sem categoria disponível para a idade atual ({age} anos).</p>
                ) : (
                  <div className="space-y-1.5">
                    {availableTypes.filter(hasCategories).map(type => {
                      const allowed = type === 'ESTADUAL' ? getAutoCategoryForAge(type, age) : getAllowedCategoriesForAge(type, age);
                      if (allowed.length === 0) return null;
                      return (
                        <div key={type} className="flex items-center text-sm">
                          <span className="font-medium text-sky-800 w-24">{RANKING_TYPE_LABELS[type]}</span>
                          <span className="text-sky-600 px-2">·</span>
                          <span className="text-sky-700">{allowed.map(c => `${c} anos`).join(', ')}</span>
                        </div>
                      );
                    })}
                    {availableTypes.filter(hasCategories).every(type => {
                      const allowed = type === 'ESTADUAL' ? getAutoCategoryForAge(type, age) : getAllowedCategoriesForAge(type, age);
                      return allowed.length === 0;
                    }) && (
                      <p className="text-xs text-sky-700/70 italic">Nenhuma categoria encontrada para {age} anos.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={fieldIds.dominance} className="block text-sm font-medium text-gray-700 mb-1">Dominância</label>
              <select
                id={fieldIds.dominance}
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
              <label htmlFor={fieldIds.backhand} className="block text-sm font-medium text-gray-700 mb-1">Backhand</label>
              <select
                id={fieldIds.backhand}
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
            <span className="block text-sm font-medium text-gray-700 mb-2">Ranking</span>
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
