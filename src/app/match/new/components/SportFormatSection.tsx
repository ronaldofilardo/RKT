'use client';

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

  return (
    <>
      {/* ESPORTE */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">ESPORTE *</h2>
          <select
            value={sportType}
            onChange={(e) => onSportChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
          >
            <option value="" disabled className="text-gray-900">
              Selecione o esporte
            </option>
            {SPORT_TYPES.map((sport) => (
              <option key={sport.value} value={sport.value} className="text-gray-900">
                {sport.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* FORMATO */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">FORMATO DO JOGO *</h2>
          <div className="flex-1">
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
            >
              <option value="" disabled className="text-gray-900">
                Selecione
              </option>
              {TENNIS_FORMATS.map((f) => (
                <option key={f.value} value={f.value} className="text-gray-900">
                  {f.label}
                </option>
              ))}
            </select>
            {TENNIS_FORMATS.find((f) => f.value === format)?.hint && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex gap-2 mt-2">
                <span className="text-sky-600 text-lg">💡</span>
                <p className="text-sm text-sky-800">
                  {TENNIS_FORMATS.find((f) => f.value === format)?.hint}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QUADRA */}
      {showCourtType && (
        <section className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">TIPO DE QUADRA *</h2>
          <div className="grid grid-cols-3 gap-3">
            {COURT_TYPES.map((court) => (
              <button
                key={court.value}
                type="button"
                onClick={() => onCourtChange(court.value)}
                className={`py-4 px-3 rounded-lg border-2 font-medium flex flex-col items-center gap-2 transition-all 
                ${
                  courtType === court.value
                    ? 'border-current ring-2 ring-offset-2 scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  {
                    borderColor: courtType === court.value ? court.color : undefined,
                    color: courtType === court.value ? court.color : undefined,
                  } as React.CSSProperties
                }
              >
                <span className="text-2xl">{court.icon}</span>
                <span className="text-sm font-semibold">{court.label}</span>
                <span className="text-xs text-gray-500">{court.note}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}