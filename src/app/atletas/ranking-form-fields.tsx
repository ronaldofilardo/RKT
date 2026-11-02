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

  // Sem categoria (ex.: tipos sem faixa etária), a Classe sobe para a linha 1.
  const firstRow = showCategory ? (
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

  const showSecondRow = (showCategory && showClasses) || showJuvenilePosition;

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="grid grid-cols-2 gap-3">{firstRow}</div>
      {showSecondRow && (
        <div className="grid grid-cols-2 gap-3">
          {showCategory && classField}
          {showJuvenilePosition && (
            <RankingNumberField
              id={`ranking-${type}-juvenile-position`}
              label="Posição Ranking Juvenil"
              value={state.juvenilePosition}
              disabled={saving}
              onChange={change('juvenilePosition')}
            />
          )}
        </div>
      )}
    </div>
  );
}
