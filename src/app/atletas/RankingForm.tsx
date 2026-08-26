'use client';

import { RANKING_TYPE_LABELS, RankingType } from '@/lib/ranking/rankingConstants';
import {
  computeAvailableTypes,
  computeCategoriesForType,
  shouldShowCategory,
  shouldShowClass,
  shouldShowJuvenilePosition,
  computeClassesForType,
} from './rankingLogic';

interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
}

interface RankingFormProps {
  form: {
    gender: string;
  };
  rankings: Record<RankingType, RankingState>;
  age: number | null;
  saving: boolean;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
  showHeader?: boolean;
}

const inlineLabelClass = 'text-xs text-gray-500 whitespace-nowrap';
const inlineSelectClass = 'h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500';
const inlineInputClass = 'h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

export function RankingForm({ form, rankings, age, saving, onRankingToggle, onRankingFieldChange, showHeader = true }: RankingFormProps) {
  const availableTypes = computeAvailableTypes(age, form.gender).filter((type) => type in rankings);

  return (
    <div>
      {showHeader && (
        <>
          <p className="block text-xs font-medium text-gray-700 mb-1">Ranking <span className="font-normal text-gray-500">Opções de autoranking</span></p>
          {age !== null && (
            <p className="text-xs text-gray-600 mb-2 bg-gray-100 px-2 py-1 rounded-md">
              Idade: <span className="font-semibold text-gray-900">{age} anos</span>
            </p>
          )}
        </>
      )}
      <div className="space-y-1.5">
        {availableTypes.map((type) => {
          const categories = computeCategoriesForType(type, age);
          const showCategory = shouldShowCategory(type, age, categories);
          const showClasses = shouldShowClass(type, rankings[type], form.gender, age);
          const showJuvenilePosition = shouldShowJuvenilePosition(type, rankings[type], rankings[type].category);
          const classOptions = computeClassesForType(rankings[type].category, form.gender, age);

          return (
            <div key={type} className="rounded-md border border-gray-200 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`ranking-${type}`}
                    checked={rankings[type].enabled}
                    onChange={() => onRankingToggle(type)}
                    disabled={saving}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor={`ranking-${type}`} className="text-xs font-medium text-gray-700">
                    {RANKING_TYPE_LABELS[type]}
                  </label>
                </div>

                {rankings[type].enabled && (
                  <>
                    {showCategory && (
                      <div className="flex items-center gap-1">
                        <label htmlFor={`ranking-${type}-category`} className={inlineLabelClass}>Categoria</label>
                        <select
                          id={`ranking-${type}-category`}
                          value={rankings[type].category}
                          onChange={(e) => onRankingFieldChange(type, 'category', e.target.value)}
                          disabled={saving}
                          className={`${inlineSelectClass} min-w-[7rem]`}
                        >
                          <option value="">Selecione...</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat} anos</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {showClasses && (
                      <div className="flex items-center gap-1">
                        <label htmlFor={`ranking-${type}-class`} className={inlineLabelClass}>Classe</label>
                        <select
                          id={`ranking-${type}-class`}
                          value={rankings[type].class}
                          onChange={(e) => onRankingFieldChange(type, 'class', e.target.value)}
                          disabled={saving}
                          className={`${inlineSelectClass} min-w-[6.5rem]`}
                        >
                          <option value="">Selecione...</option>
                          {classOptions.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <label htmlFor={`ranking-${type}-position`} className={inlineLabelClass}>Posição</label>
                      <input
                        id={`ranking-${type}-position`}
                        type="number"
                        min="1"
                        value={rankings[type].position}
                        onChange={(e) => onRankingFieldChange(type, 'position', e.target.value)}
                        disabled={saving}
                        placeholder="Posição"
                        className={`${inlineInputClass} w-24`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onRankingToggle(type)}
                      disabled={saving}
                      className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Remover este ranking"
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>

              {rankings[type].enabled && showJuvenilePosition && (
                <div className="mt-1.5 flex items-center gap-1 pl-6">
                  <label htmlFor={`ranking-${type}-juvenile-position`} className={inlineLabelClass}>Posição Ranking Juvenil</label>
                  <input
                    id={`ranking-${type}-juvenile-position`}
                    type="number"
                    min="1"
                    value={rankings[type].juvenilePosition}
                    onChange={(e) => onRankingFieldChange(type, 'juvenilePosition', e.target.value)}
                    disabled={saving}
                    placeholder="Posição no ranking juvenil"
                    className={`${inlineInputClass} w-36`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
