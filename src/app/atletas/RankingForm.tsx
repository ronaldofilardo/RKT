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

const inlineLabelClass = 'h-4 flex items-center text-xs text-telemetry-text-muted whitespace-nowrap';
const inlineSelectClass = 'h-8 rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-volt';
const inlineInputClass = 'h-8 rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary placeholder-telemetry-text-muted focus:outline-none focus:ring-1 focus:ring-telemetry-volt';

export function RankingForm({ form, rankings, age, saving, onRankingToggle, onRankingFieldChange, showHeader = true }: RankingFormProps) {
  const availableTypes = computeAvailableTypes(age, form.gender).filter((type) => type in rankings);

  return (
    <div>
      {showHeader && (
        <p className="block text-xs font-medium text-telemetry-text-primary mb-1">Ranking</p>
      )}
      <div className="space-y-2">
        {availableTypes.map((type) => {
          const categories = computeCategoriesForType(type, age);
          const showCategory = shouldShowCategory(type, age, categories);
          const showClasses = shouldShowClass(type, rankings[type], form.gender, age);
          const showJuvenilePosition = shouldShowJuvenilePosition(type, rankings[type], rankings[type].category);
          const classOptions = computeClassesForType(rankings[type].category, form.gender, age);

          return (
            <div key={type} className="rounded-lg border border-white/10 bg-telemetry-card/30 p-3">
              <div className="flex flex-nowrap items-start gap-2.5 sm:gap-3.5 overflow-x-auto">
                {/* Coluna 1: Checkbox (linha 1) e Remover (linha 2) */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center gap-1.5 h-4">
                    <input
                      type="checkbox"
                      id={`ranking-${type}`}
                      checked={rankings[type].enabled}
                      onChange={() => onRankingToggle(type)}
                      disabled={saving}
                      className="h-4 w-4 rounded border-white/20 bg-telemetry-elevated text-telemetry-volt focus:ring-telemetry-volt cursor-pointer"
                    />
                    <label htmlFor={`ranking-${type}`} className="text-xs font-semibold text-telemetry-text-primary cursor-pointer select-none">
                      {RANKING_TYPE_LABELS[type]}
                    </label>
                  </div>

                  {rankings[type].enabled && (
                    <div className="h-8 flex items-center">
                      <button
                        type="button"
                        onClick={() => onRankingToggle(type)}
                        disabled={saving}
                        className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                        title="Remover este ranking"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {rankings[type].enabled && (
                  <>
                    {/* Categoria */}
                    {showCategory && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <label htmlFor={`ranking-${type}-category`} className={inlineLabelClass}>
                          Categoria
                        </label>
                        <select
                          id={`ranking-${type}-category`}
                          value={rankings[type].category}
                          onChange={(e) => onRankingFieldChange(type, 'category', e.target.value)}
                          disabled={saving}
                          className={`${inlineSelectClass} min-w-[6.75rem]`}
                        >
                          <option value="">Selecione...</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat} anos</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Classe */}
                    {showClasses && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <label htmlFor={`ranking-${type}-class`} className={inlineLabelClass}>
                          Classe
                        </label>
                        <select
                          id={`ranking-${type}-class`}
                          value={rankings[type].class}
                          onChange={(e) => onRankingFieldChange(type, 'class', e.target.value)}
                          disabled={saving}
                          className={`${inlineSelectClass} min-w-[6rem]`}
                        >
                          <option value="">Selecione...</option>
                          {classOptions.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Posição */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <label htmlFor={`ranking-${type}-position`} className={inlineLabelClass}>
                        Posição
                      </label>
                      <input
                        id={`ranking-${type}-position`}
                        type="number"
                        min="1"
                        value={rankings[type].position}
                        onChange={(e) => onRankingFieldChange(type, 'position', e.target.value)}
                        disabled={saving}
                        placeholder="Posição"
                        className={`${inlineInputClass} w-16 sm:w-20`}
                      />
                    </div>

                    {/* Posição Ranking Juvenil */}
                    {showJuvenilePosition && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <label htmlFor={`ranking-${type}-juvenile-position`} className={inlineLabelClass}>
                          Posição Ranking Juvenil
                        </label>
                        <input
                          id={`ranking-${type}-juvenile-position`}
                          type="number"
                          min="1"
                          value={rankings[type].juvenilePosition}
                          onChange={(e) => onRankingFieldChange(type, 'juvenilePosition', e.target.value)}
                          disabled={saving}
                          placeholder="Posição"
                          className={`${inlineInputClass} w-20 sm:w-24`}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
