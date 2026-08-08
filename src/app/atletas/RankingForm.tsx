'use client';

import { RANKING_TYPE_LABELS, RankingType, hasCategories, hasClasses, getCategoriesForAge, getAllowedCategoriesForAge, getAutoCategoryForAge, getClassesForSelection } from '@/app/match/new/rankingConstants';

interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
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
}

export function RankingForm({ form, rankings, age, saving, onRankingToggle, onRankingFieldChange }: RankingFormProps) {
  const availableTypes = age === null
    ? Object.keys(rankings) as RankingType[]
    : (Object.keys(rankings) as RankingType[]).filter((type) => {
        if (type === 'ESTADUAL') return true;
        if (type === 'ATP' || type === 'WTA') return age <= 40;
        if (!hasCategories(type)) return true;
        return getCategoriesForAge(type, age!).length > 0;
      });

  return (
    <div>
      <p className="block text-xs font-medium text-gray-700 mb-1">Ranking</p>
      {age !== null && (
        <p className="text-xs text-gray-600 mb-2 bg-gray-100 px-2 py-1 rounded-md">
          Idade: <span className="font-semibold text-gray-900">{age} anos</span>
        </p>
      )}
      <div className="space-y-1.5">
        {availableTypes.map((type) => {
          const showCategory = hasCategories(type) && age !== null && age < 19;
          const showClasses = hasClasses(type) && rankings[type].enabled && form.gender !== '' && age !== null && age >= 11;

          return (
            <div key={type} className="border border-gray-200 rounded-md px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <input
                  type="checkbox"
                  id={`ranking-${type}`}
                  checked={rankings[type].enabled}
                  onChange={() => onRankingToggle(type)}
                  disabled={saving}
                  className="w-3.5 h-3.5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor={`ranking-${type}`} className="text-xs font-medium text-gray-700">
                  {RANKING_TYPE_LABELS[type]}
                </label>
                {rankings[type].enabled && (
                  <button
                    type="button"
                    onClick={() => onRankingToggle(type)}
                    disabled={saving}
                    className="ml-auto text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                    title="Remover este ranking"
                  >
                    Remover
                  </button>
                )}
              </div>
              {rankings[type].enabled && (
                <div className="ml-5 space-y-1.5">
                  {showCategory && (
                    <div>
                      <label htmlFor={`ranking-${type}-category`} className="block text-xs text-gray-500 mb-0.5">Categoria</label>
                      <select
                        id={`ranking-${type}-category`}
                        value={rankings[type].category}
                        onChange={(e) => onRankingFieldChange(type, 'category', e.target.value)}
                        disabled={saving}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-gray-900 text-xs"
                      >
                        <option value="">Selecione...</option>
                        {(type === 'ESTADUAL' ? getAutoCategoryForAge(type, age!) : getAllowedCategoriesForAge(type, age!)).map((cat) => (
                          <option key={cat} value={cat}>{cat} anos</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {showClasses && (
                    <div>
                      <label htmlFor={`ranking-${type}-class`} className="block text-xs text-gray-500 mb-0.5">Classe</label>
                      <select
                        id={`ranking-${type}-class`}
                        value={rankings[type].class}
                        onChange={(e) => onRankingFieldChange(type, 'class', e.target.value)}
                        disabled={saving}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-gray-900 text-xs"
                      >
                        <option value="">Selecione...</option>
                        {age !== null && form.gender ? getClassesForSelection(rankings[type].category, form.gender, age).map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        )) : []}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor={`ranking-${type}-position`} className="block text-xs text-gray-500 mb-0.5">Posição</label>
                    <input
                      id={`ranking-${type}-position`}
                      type="number"
                      min="1"
                      value={rankings[type].position}
                      onChange={(e) => onRankingFieldChange(type, 'position', e.target.value)}
                      disabled={saving}
                      placeholder="Posição"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}