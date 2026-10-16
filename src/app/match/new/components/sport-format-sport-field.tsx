'use client';

import { useEffect, useRef } from 'react';
import { SPORT_TYPES } from '../matchConstants';

interface SportFormatSportFieldProps {
  sportType: string;
  onSportChange: (value: string) => void;
}

export function SportFormatSportField({ sportType, onSportChange }: SportFormatSportFieldProps) {
  const sportSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    sportSelectRef.current?.focus();
  }, []);

  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="sport-select" className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
          ESPORTE *
        </label>
        <select
          id="sport-select"
          ref={sportSelectRef}
          value={sportType}
          onChange={(e) => onSportChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary [color-scheme:dark]"
          required
        >
          <option value="" disabled className="bg-telemetry-elevated text-telemetry-text-primary">
            Selecione o esporte
          </option>
          {SPORT_TYPES.map((sport) => (
            <option key={sport.value} value={sport.value} className="bg-telemetry-elevated text-telemetry-text-primary">
              {sport.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
