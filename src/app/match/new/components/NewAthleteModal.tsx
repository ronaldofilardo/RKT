'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Athlete } from '../types';
import { useAge } from '../hooks/useAge';
import { RankingForm } from '@/app/atletas/RankingForm';
import {
  RankingState,
  initialRankings,
  rankingsStateToPayload,
  computeAvailableTypes,
  computeCategoryAge,
  computeClassesForType,
  handleRankingToggle,
  handleRankingFieldChange,
  handleAutoCategoryAssignment,
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  getAllowedCategoriesForAge,
} from '@/app/atletas/rankingLogic';

interface NewAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
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

  const [rankings, setRankings] = useState<Record<string, RankingState>>(initialRankings());

  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);
  const birthYearNum = form.birthYear ? parseInt(form.birthYear, 10) : 0;

  useEffect(() => {
    handleAutoCategoryAssignment(setRankings, age);
  }, [age]);

  const availableTypes = useMemo(
    () => computeAvailableTypes(age),
    [age]
  );

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');

      const rankingsPayload = rankingsStateToPayload(rankings);

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
      setRankings(initialRankings());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
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
                onChange={(e) => handleRankingFieldChange(setRankings, 'ESTADUAL', 'class', e.target.value)}
                disabled={submitting || age === null || !form.gender || (age ?? 0) < 11 || (age ?? 0) > 90}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {(age === null || !form.gender) ? 'Aguardando...' : 'Selecione...'}
                </option>
                {age !== null && form.gender && age >= 11 && age <= 90 && computeClassesForType('', form.gender, age).map((cls) => (
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
                    {age === null || !form.gender ? (
                  <p className="text-xs text-sky-700/70 italic">Preencha sexo e data de nascimento para ver as categorias.</p>
                ) : age < 11 || age > 90 ? (
                  <p className="text-xs text-sky-700/70 italic">Sem categoria disponível para a idade atual ({age} anos).</p>
                ) : (
                  <div className="space-y-1.5">
                    {(() => {
                      const categoryRankingTypes = availableTypes.filter((type) =>
                        RANKING_TYPES.includes(type as any) && !['ATP', 'WTA', 'ITF'].includes(type)
                      );
                      return categoryRankingTypes.map((type) => {
                        const rankingType = type as keyof typeof RANKING_TYPE_LABELS;
                        const catAge = computeCategoryAge(rankingType, age, birthYearNum);
                        const allowed = catAge !== null
                          ? (type === 'ITF_Juniors' ? ['18'] : getAllowedCategoriesForAge(rankingType, catAge))
                          : [];
                        if (allowed.length === 0) return null;
                        return (
                          <div key={type} className="flex items-center text-sm">
                            <span className="font-medium text-sky-800 w-24">{RANKING_TYPE_LABELS[rankingType]}</span>
                            <span className="text-sky-600 px-2">·</span>
                            <span className="text-sky-700">{allowed.map(c => `${c} anos`).join(', ')}</span>
                          </div>
                        );
                      });
                    })()}
                    {(() => {
                      const categoryRankingTypes = availableTypes.filter((type) =>
                        RANKING_TYPES.includes(type as any) && !['ATP', 'WTA', 'ITF'].includes(type)
                      );
                      return categoryRankingTypes.every((type) => {
                        const rankingType = type as keyof typeof RANKING_TYPE_LABELS;
                        const catAge = computeCategoryAge(rankingType, age, birthYearNum);
                        const allowed = catAge !== null
                          ? (type === 'ITF_Juniors' ? ['18'] : getAllowedCategoriesForAge(rankingType, catAge))
                          : [];
                        return allowed.length === 0;
                      });
                    })() && (
                      <p className="text-xs text-sky-700/70 italic">Nenhuma categoria encontrada para {age} anos.</p>
                    )}
                  </div>
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
            <RankingForm
              form={{ gender: form.gender }}
              rankings={rankings as Record<string, RankingState>}
              age={age}
              saving={submitting}
              onRankingToggle={(type) => handleRankingToggle(setRankings, type as any)}
              onRankingFieldChange={(type, field, value) => handleRankingFieldChange(setRankings, type as any, field, value)}
            />
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