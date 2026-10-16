'use client';

import { SportFormatSportField } from './sport-format-sport-field';
import { SportFormatFormatField } from './sport-format-format-field';
import { SportFormatCourtField } from './sport-format-court-field';

interface SportFormatSectionProps {
  sportType: string;
  format: string;
  courtType: string;
  onSportChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  onCourtChange: (value: string) => void;
}

export function SportFormatSection({
  sportType,
  format,
  courtType,
  onSportChange,
  onFormatChange,
  onCourtChange,
}: SportFormatSectionProps) {
  return (
    <>
      <SportFormatSportField sportType={sportType} onSportChange={onSportChange} />
      <SportFormatFormatField format={format} onFormatChange={onFormatChange} />
      {sportType === 'TENNIS' && (
        <SportFormatCourtField courtType={courtType} onCourtChange={onCourtChange} />
      )}
    </>
  );
}
