import { RankingSelectField } from './ranking-select-field';
import { RankingNumberField } from './ranking-number-field';
import { RankingDateField } from './ranking-date-field';

interface ClassRowProps {
  type: string;
  cls: string;
  position: string;
  date?: string;
  classOptions: string[];
  saving: boolean;
  onClassChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export function RankingClassRow({
  type, cls, position, date, classOptions, saving,
  onClassChange, onPositionChange, onDateChange,
}: ClassRowProps) {
  return (
    <>
      <RankingSelectField
        id={`ranking-${type}-class`}
        label="Classe"
        value={cls}
        options={classOptions}
        disabled={saving}
        onChange={onClassChange}
      />
      <RankingNumberField
        id={`ranking-${type}-class-position`}
        label="Posição"
        value={position}
        disabled={saving}
        onChange={onPositionChange}
      />
      <RankingDateField
        id={`ranking-${type}-class-date`}
        label="Data da consulta"
        value={date}
        disabled={saving}
        onChange={onDateChange}
      />
    </>
  );
}
