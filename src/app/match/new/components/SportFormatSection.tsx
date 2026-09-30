'use client';

import { useEffect, useRef } from 'react';
import { SPORT_TYPES, TENNIS_FORMATS, COURT_TYPES } from '../matchConstants';

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
  const showCourtType = sportType === 'TENNIS';
  const sportSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    sportSelectRef.current?.focus();
  }, []);

  return (
    <>
      {/* ESPORTE */}
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

      {/* FORMATO */}
      <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="format-select" className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
            FORMATO DO JOGO *
          </label>
          <div className="flex-1">
            <select
              id="format-select"
              value={format}
              onChange={(e) => onFormatChange(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary [color-scheme:dark]"
              required
            >
              <option value="" disabled className="bg-telemetry-elevated text-telemetry-text-primary">
                Selecione
              </option>
              {TENNIS_FORMATS.map((f) => (
                <option key={f.value} value={f.value} className="bg-telemetry-elevated text-telemetry-text-primary">
                  {f.label}
                </option>
              ))}
            </select>
            {TENNIS_FORMATS.find((f) => f.value === format)?.hint && (
              <div className="bg-telemetry-blue/10 border border-telemetry-blue/50 rounded-lg p-3 flex gap-2 mt-2">
                <span className="text-telemetry-blue text-lg">💡</span>
                <p className="text-sm text-telemetry-text-primary opacity-90">
                  {TENNIS_FORMATS.find((f) => f.value === format)?.hint}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QUADRA */}
      {showCourtType && (
        <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
          <label htmlFor="courtType" className="text-lg font-semibold text-telemetry-text-primary mb-3 block">
            TIPO DE QUADRA *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {COURT_TYPES.map((court) => (
              <button
                key={court.value}
                type="button"
                onClick={() => onCourtChange(court.value)}
                className={`py-4 px-3 rounded-lg border-2 font-medium flex flex-col items-center gap-2 transition-all 
                ${
                  courtType === court.value
                    ? 'border-current ring-2 ring-offset-2 ring-offset-telemetry-base scale-105'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/'
                }`}
                style={
                  {
                    borderColor: courtType === court.value ? court.color : undefined,
                    color: courtType === court.value ? court.color : undefined,
                  } as React.CSSProperties
                }
              >
                <span className="text-2xl">{court.icon}</span>
                <span className="text-sm font-semibold text-telemetry-text-primary">{court.label}</span>
                <span className="text-xs text-telemetry-text-muted">{court.note}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}