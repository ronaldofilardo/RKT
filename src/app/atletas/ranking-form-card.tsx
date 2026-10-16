'use client';

import { RANKING_TYPE_LABELS, RankingType } from '@/lib/ranking/rankingConstants';
import {
  computeCategoriesForType,
  shouldShowCategory,
  shouldShowClass,
  shouldShowJuvenilePosition,
  computeClassesForType,
} from './rankingLogic';
import type { RankingState } from './ranking-form.types';
import { RankingFields } from './ranking-form-fields';

interface RankingTypeCardProps {
  type: RankingType;
  state: RankingState;
  gender: string;
  age: number | null;
  saving: boolean;
  onToggle: (type: RankingType) => void;
  onFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function RankingTypeCard({ type, state, gender, age, saving, onToggle, onFieldChange }: RankingTypeCardProps) {
  const categories = computeCategoriesForType(type, age);
  const showCategory = shouldShowCategory(type, age, categories);
  const showClasses = shouldShowClass(type, state, gender, age);
  const showJuvenilePosition = shouldShowJuvenilePosition(type, state, state.category);
  const classOptions = computeClassesForType(state.category, gender, age);

  return (
    <div className="rounded-lg border border-white/10 bg-telemetry-card/30 p-3">
      <div className="flex flex-nowrap items-start gap-2.5 sm:gap-3.5 overflow-x-auto">
        {/* Coluna 1: Checkbox (linha 1) e Remover (linha 2) */}
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1.5 h-4">
            <input
              type="checkbox"
              id={`ranking-${type}`}
              checked={state.enabled}
              onChange={() => onToggle(type)}
              disabled={saving}
              className="h-4 w-4 rounded border-white/20 bg-telemetry-elevated text-telemetry-volt focus:ring-telemetry-volt cursor-pointer"
            />
            <label htmlFor={`ranking-${type}`} className="text-xs font-semibold text-telemetry-text-primary cursor-pointer select-none">
              {RANKING_TYPE_LABELS[type]}
            </label>
          </div>

          {state.enabled && (
            <div className="h-8 flex items-center">
              <button
                type="button"
                onClick={() => onToggle(type)}
                disabled={saving}
                className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                title="Remover este ranking"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        {state.enabled && (
          <RankingFields
            type={type}
            state={state}
            saving={saving}
            categories={categories}
            classOptions={classOptions}
            showCategory={showCategory}
            showClasses={showClasses}
            showJuvenilePosition={showJuvenilePosition}
            onFieldChange={onFieldChange}
          />
        )}
      </div>
    </div>
  );
}
