'use client';

import { TENNIS_FORMATS } from '../matchConstants';

interface SportFormatFormatFieldProps {
  format: string;
  onFormatChange: (value: string) => void;
}

export function SportFormatFormatField({ format, onFormatChange }: SportFormatFormatFieldProps) {
  const hint = TENNIS_FORMATS.find((f) => f.value === format)?.hint;

  return (
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
          {hint && (
            <div className="bg-telemetry-blue/10 border border-telemetry-blue/50 rounded-lg p-3 flex gap-2 mt-2">
              <span className="text-telemetry-blue text-lg">💡</span>
              <p className="text-sm text-telemetry-text-primary opacity-90">
                {hint}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
