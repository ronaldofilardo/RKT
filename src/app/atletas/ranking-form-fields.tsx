import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-form.types';
import { RankingNumberField } from './ranking-number-field';
import { RankingDateField } from './ranking-date-field';
import { RankingCategoryRow } from './ranking-category-row';
import { RankingClassRow } from './ranking-class-row';
import { RankingFormRows } from './ranking-form-rows';

interface RankingFieldsProps {
  type: RankingType;
  state: RankingState;
  saving: boolean;
  categories: string[];
  classOptions: string[];
  showCategory: boolean;
  showClasses: boolean;
  showJuvenilePosition?: boolean;
  onFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function RankingFields({
  type, state, saving, categories, classOptions,
  showCategory, showClasses, showJuvenilePosition, onFieldChange,
}: RankingFieldsProps) {
  const change = (field: keyof RankingState) => (value: string) => onFieldChange(type, field, value);

  const categoryRow = showCategory ? (
    <RankingCategoryRow
      type={type}
      category={state.category}
      position={state.position}
      date={state.rankingDate}
      categories={categories}
      saving={saving}
      showJuvenilePosition={showJuvenilePosition}
      onCategoryChange={change('category')}
      onPositionChange={change('position')}
      onDateChange={change('rankingDate')}
    />
  ) : null;

  const classRow = showClasses ? (
    <RankingClassRow
      type={type}
      cls={state.class}
      position={showCategory ? (state.classPosition || state.juvenilePosition || '') : state.position}
      date={showCategory ? (state.classRankingDate || '') : (state.rankingDate || '')}
      classOptions={classOptions}
      saving={saving}
      onClassChange={change('class')}
      onPositionChange={showCategory ? change('classPosition') : change('position')}
      onDateChange={showCategory ? change('classRankingDate') : change('rankingDate')}
    />
  ) : null;

  const hasOnlyPosition = !showCategory && !showClasses;
  const onlyPositionRow = hasOnlyPosition ? (
    <>
      <RankingNumberField
        id={`ranking-${type}-position`}
        label="Posição"
        value={state.position}
        disabled={saving}
        onChange={change('position')}
      />
      <RankingDateField
        id={`ranking-${type}-date`}
        label="Data da consulta"
        value={state.rankingDate}
        disabled={saving}
        onChange={change('rankingDate')}
      />
    </>
  ) : null;

  return (
    <RankingFormRows
      hasOnlyPosition={hasOnlyPosition}
      showCategory={showCategory}
      showClasses={showClasses}
      categoryRow={categoryRow}
      classRow={classRow}
      onlyPositionRow={onlyPositionRow}
    />
  );
}
