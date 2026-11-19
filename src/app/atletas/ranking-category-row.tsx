import { RankingSelectField } from './ranking-select-field';
import { RankingNumberField } from './ranking-number-field';
import { RankingDateField } from './ranking-date-field';

interface CategoryRowProps {
  type: string;
  category: string;
  position: string;
  date?: string;
  categories: string[];
  saving: boolean;
  showJuvenilePosition?: boolean;
  onCategoryChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export function RankingCategoryRow({
  type, category, position, date, categories, saving, showJuvenilePosition,
  onCategoryChange, onPositionChange, onDateChange,
}: CategoryRowProps) {
  return (
    <>
      <RankingSelectField
        id={`ranking-${type}-category`}
        label="Categoria"
        value={category}
        options={categories}
        optionSuffix=" anos"
        disabled={saving}
        onChange={onCategoryChange}
      />
      <RankingNumberField
        id={`ranking-${type}-position`}
        label="Posição"
        ariaLabel={showJuvenilePosition ? 'Posição Ranking Juvenil' : undefined}
        value={position}
        disabled={saving}
        onChange={onPositionChange}
      />
      <RankingDateField
        id={`ranking-${type}-date`}
        label="Data da consulta"
        value={date}
        disabled={saving}
        onChange={onDateChange}
      />
    </>
  );
}
