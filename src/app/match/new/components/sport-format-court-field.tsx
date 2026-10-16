'use client';

import { COURT_TYPES } from '../matchConstants';

interface SportFormatCourtFieldProps {
  courtType: string;
  onCourtChange: (value: string) => void;
}

export function SportFormatCourtField({ courtType, onCourtChange }: SportFormatCourtFieldProps) {
  return (
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
  );
}
