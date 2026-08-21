'use client';

import { useEffect, useRef } from 'react';
import { SportFormatSectionView } from './SportFormatSection.view';

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
  const sportSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    sportSelectRef.current?.focus();
  }, []);

  return <SportFormatSectionView sportType={sportType} format={format} courtType={courtType} sportSelectRef={sportSelectRef} onSportChange={onSportChange} onFormatChange={onFormatChange} onCourtChange={onCourtChange} />;
}
