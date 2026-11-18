import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-form.types';
import { RankingSelectField } from './ranking-select-field';
import { RankingNumberField } from './ranking-number-field';
import { RankingDateField } from './ranking-date-field';
import { RankingFormRows } from './ranking-form-rows';

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
    <RankingDateField
      id={`ranking-${type}-date`}
      value={state.rankingDate}
      disabled={saving}
      onChange={change('rankingDate')}
    />
  );

  const hasOnlyPosition = !showCategory && !showClasses;
  const firstRow = hasOnlyPosition ? (
    <>{positionField}{rankingDateField}</>
  ) : showCategory ? (
    <><RankingSelectField id={`ranking-${type}-category`} label="Categoria" value={state.category} options={categories} optionSuffix=" anos" disabled={saving} onChange={change('category')} />{positionField}</>
  ) : (
    <>{classField}{positionField}</>
  );

  return (
    <RankingFormRows
      type={type}
      state={state}
      saving={saving}
      showCategory={showCategory}
      showClasses={showClasses}
      showJuvenilePosition={showJuvenilePosition}
      hasOnlyPosition={hasOnlyPosition}
      firstRow={firstRow}
      classField={classField}
      rankingDateField={rankingDateField}
      onJuvenilePositionChange={change('juvenilePosition')}
    />
  );
}
