import React from 'react';
import { RankingForm } from '@/app/atletas/RankingForm';
import { getMatchCategoriesForAge, MATCH_CATEGORY_LABELS, type MatchCategory } from '@/lib/ranking/rankingConstants';
import { computeClassesForType, type RankingState } from '@/app/atletas/rankingLogic';
import type { RankingType } from '@/lib/ranking/rankingConstants';

const MATCH_CATEGORY_AGE_LABELS: Record<MatchCategory, string> = {
  INFANTIL: '11–12 anos',
  JUVENIL: '13–18 anos',
  ADULTO: '19–34 anos',
  VETERANO: '35 anos ou mais',
};

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

interface NewAthleteModalFormProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  rankings: Record<RankingType, RankingState>;
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>;
  age: number | null;
  submitting: boolean;
  nameInputRef: React.RefObject<HTMLInputElement>;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function NewAthleteModalForm({
  form,
  setForm,
  rankings,
  age,
  submitting,
  nameInputRef,
  onRankingToggle,
  onRankingFieldChange
}: NewAthleteModalFormProps) {
  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <section aria-labelledby="new-athlete-cadastro-title" className="space-y-4 rounded-xl border border-gray-200 p-4">
        <h3 id="new-athlete-cadastro-title" className="text-base font-semibold text-gray-900">1. Cadastro</h3>

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
              <option value="" className="text-gray-900">Selecione...</option>
              <option value="MALE" className="text-gray-900">Masculino</option>
              <option value="FEMALE" className="text-gray-900">Feminino</option>
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

        {(!rankings.ESTADUAL.enabled || age === null || age < 11 || age > 90) && (
          <div className="grid grid-cols-4 gap-4 items-start">
            <div className="col-span-1">
              <label htmlFor={fieldIds.class} className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select
                id={fieldIds.class}
                value={rankings.ESTADUAL.class}
                onChange={(e) => onRankingFieldChange('ESTADUAL', 'class', e.target.value)}
                disabled={submitting || age === null || !form.gender || age < 11 || age > 90}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">{(age === null || !form.gender) ? 'Aguardando...' : 'Selecione...'}</option>
                {age !== null && form.gender && age >= 11 && age <= 90 && computeClassesForType(rankings.ESTADUAL.category, form.gender, age).map((cls) => (
                  <option key={cls} value={cls} className="text-gray-900">{cls}</option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 h-full">
              <h3 className="text-sm font-semibold text-sky-900 mb-2">Categoria por idade</h3>
              {age === null || !form.gender ? (
                <p className="text-xs text-sky-700/70 italic">Preencha sexo e data de nascimento para identificar a categoria.</p>
              ) : age < 11 || age > 90 ? (
                <p className="text-xs text-sky-700/70 italic">Sem categoria etária disponível para a idade atual ({age} anos).</p>
              ) : (
                <div className="space-y-1.5">
                  {getMatchCategoriesForAge(age).map((category) => (
                    <div key={category} className="flex items-center text-sm">
                      <span className="font-medium text-sky-800">{MATCH_CATEGORY_LABELS[category]}</span>
                      <span className="text-sky-600 px-2">·</span>
                      <span className="text-sky-700">{MATCH_CATEGORY_AGE_LABELS[category]}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        )}

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
              <option value="" className="text-gray-900">Selecione...</option>
              <option value="RIGHT" className="text-gray-900">Destro</option>
              <option value="LEFT" className="text-gray-900">Canhoto</option>
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
              <option value="" className="text-gray-900">Selecione...</option>
              <option value="ONE_HANDED" className="text-gray-900">Uma mão</option>
              <option value="TWO_HANDED" className="text-gray-900">Duas mãos</option>
            </select>
          </div>
        </div>

      </section>

      <section aria-labelledby="new-athlete-ranking-title" className="space-y-4 rounded-xl border border-gray-200 p-4">
        <h3 id="new-athlete-ranking-title" aria-label="2. Ranking" className="flex items-baseline gap-2 text-base font-semibold text-gray-900">
          <span>2. Ranking</span>
          <span className="text-sm font-normal text-gray-700">Opções de autoranking</span>
        </h3>
        {age !== null && (
          <p className="text-xs text-gray-500">Idade: <span className="font-semibold text-gray-900">{age} anos</span></p>
        )}
        <RankingForm
          showHeader={false}
          form={{ gender: form.gender }}
          rankings={rankings}
          age={age}
          saving={submitting}
          onRankingToggle={onRankingToggle}
          onRankingFieldChange={onRankingFieldChange}
        />
      </section>
    </div>
  );
}
