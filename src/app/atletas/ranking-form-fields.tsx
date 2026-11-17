import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-form.types';
import { RankingSelectField } from './ranking-select-field';
import { RankingNumberField } from './ranking-number-field';

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

/**
 * Campos de cada subseção de ranking em duas linhas (sem scroll horizontal):
 * linha 1 = Categoria + Posição (ou Classe + Posição quando não há categoria);
 * linha 2 = Classe + Posição Ranking Juvenil.
 */
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
  const change = (field: keyof RankingState) => (value: string) => onFieldChange(type, field, value);

  const positionField = (
    <RankingNumberField
      id={`ranking-${type}-position`}
      label="Posição"
      value={state.position}
      disabled={saving}
      onChange={change('position')}
    />
  );

  const classField = showClasses ? (
    <RankingSelectField
      id={`ranking-${type}-class`}
      label="Classe"
      value={state.class}
      options={classOptions}
      disabled={saving}
      onChange={change('class')}
    />
  ) : null;

  const rankingDateField = (
    <div>
      <label
        htmlFor={`ranking-${type}-date`}
        className="block text-xs font-medium text-telemetry-text-muted mb-1"
      >
        Data do Ranking
      </label>
      <input
        type="date"
        id={`ranking-${type}-date`}
        value={state.rankingDate ?? ''}
        disabled={saving}
        onChange={(e) => change('rankingDate')(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs [color-scheme:dark]"
      />
    </div>
  );

  const hasOnlyPosition = !showCategory && !showClasses;

  // Linha 1: Categoria + Posição (ou Classe + Posição; ou Posição + Data quando sem categoria/classe)
  const firstRow = hasOnlyPosition ? (
    <>
      {positionField}
      {rankingDateField}
    </>
  ) : showCategory ? (
    <>
      <RankingSelectField
        id={`ranking-${type}-category`}
        label="Categoria"
        value={state.category}
        options={categories}
        optionSuffix=" anos"
        disabled={saving}
        onChange={change('category')}
      />
      {positionField}
    </>
  ) : (
    <>
      {classField}
      {positionField}
    </>
  );

  const showThirdRow = showCategory && showClasses && showJuvenilePosition;

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="grid grid-cols-2 gap-3">{firstRow}</div>
      {!hasOnlyPosition && (
        <div className="grid grid-cols-2 gap-3">
          {showCategory && showClasses ? (
            <>
              {classField}
              {rankingDateField}
            </>
          ) : showJuvenilePosition ? (
            <>
              <RankingNumberField
                id={`ranking-${type}-juvenile-position`}
                label="Posição Ranking Juvenil"
                value={state.juvenilePosition}
                disabled={saving}
                onChange={change('juvenilePosition')}
              />
              {rankingDateField}
            </>
          ) : (
            <>
              {rankingDateField}
              <div />
            </>
          )}
        </div>
      )}
      {showThirdRow && (
        <div className="grid grid-cols-2 gap-3">
          <RankingNumberField
            id={`ranking-${type}-juvenile-position`}
            label="Posição Ranking Juvenil"
            value={state.juvenilePosition}
            disabled={saving}
            onChange={change('juvenilePosition')}
          />
          <div />
        </div>
      )}
    </div>
  );
}
