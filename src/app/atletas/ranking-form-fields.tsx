import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-form.types';

const inlineLabelClass = 'h-4 flex items-center text-xs text-telemetry-text-muted whitespace-nowrap';
const inlineSelectClass = 'h-8 rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-volt';
const inlineInputClass = 'h-8 rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary placeholder-telemetry-text-muted focus:outline-none focus:ring-1 focus:ring-telemetry-volt';

interface RankingFieldsProps {
  type: RankingType;
  state: RankingState;
  saving: boolean;
  categories: string[];
  classOptions: string[];
  showCategory: boolean;
  showClasses: boolean;
  showJuvenilePosition: boolean;
  onFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function RankingFields({
  type,
  state,
  saving,
  categories,
  classOptions,
  showCategory,
  showClasses,
  showJuvenilePosition,
  onFieldChange,
}: RankingFieldsProps) {
  return (
    <>
      {showCategory && (
        <div className="flex flex-col gap-1 shrink-0">
          <label htmlFor={`ranking-${type}-category`} className={inlineLabelClass}>Categoria</label>
          <select
            id={`ranking-${type}-category`}
            value={state.category}
            onChange={(e) => onFieldChange(type, 'category', e.target.value)}
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

      {showClasses && (
        <div className="flex flex-col gap-1 shrink-0">
          <label htmlFor={`ranking-${type}-class`} className={inlineLabelClass}>Classe</label>
          <select
            id={`ranking-${type}-class`}
            value={state.class}
            onChange={(e) => onFieldChange(type, 'class', e.target.value)}
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

      <div className="flex flex-col gap-1 shrink-0">
        <label htmlFor={`ranking-${type}-position`} className={inlineLabelClass}>Posição</label>
        <input
          id={`ranking-${type}-position`}
          type="number"
          min="1"
          value={state.position}
          onChange={(e) => onFieldChange(type, 'position', e.target.value)}
          disabled={saving}
          placeholder="Posição"
          className={`${inlineInputClass} w-16 sm:w-20`}
        />
      </div>

      {showJuvenilePosition && (
        <div className="flex flex-col gap-1 shrink-0">
          <label htmlFor={`ranking-${type}-juvenile-position`} className={inlineLabelClass}>Posição Ranking Juvenil</label>
          <input
            id={`ranking-${type}-juvenile-position`}
            type="number"
            min="1"
            value={state.juvenilePosition}
            onChange={(e) => onFieldChange(type, 'juvenilePosition', e.target.value)}
            disabled={saving}
            placeholder="Posição"
            className={`${inlineInputClass} w-20 sm:w-24`}
          />
        </div>
      )}
    </>
  );
}
