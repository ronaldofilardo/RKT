'use client';

import { VISIBILITY_OPTIONS } from '../matchConstants';

interface MatchDetailsSectionProps {
  visibility: string;
  anotadorEmail: string;
  venueId: string;
  publicMatchCode: string;
  temperature: string;
  humidity: string;
  tags: string;
  onVisibilityChange: (value: string) => void;
  onAnotadorChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onPublicCodeChange: (value: string) => void;
  onTemperatureChange: (value: string) => void;
  onHumidityChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

export function MatchDetailsSection({
  visibility,
  anotadorEmail,
  venueId,
  publicMatchCode,
  temperature,
  humidity,
  tags,
  onVisibilityChange,
  onAnotadorChange,
  onVenueChange,
  onPublicCodeChange,
  onTemperatureChange,
  onHumidityChange,
  onTagsChange,
}: MatchDetailsSectionProps) {
  return (
    <>
      {/* VISIBILIDADE */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Visibilidade</h2>
          <div className="flex-1">
            <select
              value={visibility}
              onChange={(e) => onVisibilityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ANOTADOR */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
            Anotador (Email ou CPF) <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <input
            type="text"
            value={anotadorEmail}
            onChange={(e) => onAnotadorChange(e.target.value)}
            placeholder="Ex: anotador@exemplo.com ou 12345678901"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </section>

      {/* LOCAL */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
            Local (ID) <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <input
            type="text"
            value={venueId}
            onChange={(e) => onVenueChange(e.target.value)}
            placeholder="ID do local"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </section>

      {/* CÓDIGO PÚBLICO */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
            Código Público <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <input
            type="text"
            value={publicMatchCode}
            onChange={(e) => onPublicCodeChange(e.target.value)}
            placeholder="Código único para localizar partida"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </section>

      {/* CONDIÇÕES CLIMÁTICAS */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
            Condições Climáticas <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div>
              <label htmlFor="match-temperature" className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
              <input
                id="match-temperature"
                type="number"
                value={temperature}
                onChange={(e) => onTemperatureChange(e.target.value)}
                placeholder="Ex: 25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="match-humidity" className="block text-sm font-medium text-gray-700 mb-1">Umidade (%)</label>
              <input
                id="match-humidity"
                type="number"
                value={humidity}
                onChange={(e) => onHumidityChange(e.target.value)}
                placeholder="Ex: 60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TAGS */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">
            Tags (separadas por vírgula) <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <input
            type="text"
            value={tags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="Ex: juvenil, treino, amistoso"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </section>
    </>
  );
}
