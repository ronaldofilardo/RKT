'use client';

import { VISIBILITY_OPTIONS } from '../matchConstants';

interface MatchDetailsSectionProps {
  visibility: string;
  apontadorEmail: string;
  bracketType: 'ELIMINATION' | 'GROUPS' | 'SWISS' | '';
  venueId: string;
  publicMatchCode: string;
  temperature: string;
  humidity: string;
  tags: string;
  onVisibilityChange: (value: string) => void;
  onApontadorChange: (value: string) => void;
  onBracketChange: (value: 'ELIMINATION' | 'GROUPS' | 'SWISS' | '') => void;
  onVenueChange: (value: string) => void;
  onPublicCodeChange: (value: string) => void;
  onTemperatureChange: (value: string) => void;
  onHumidityChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

export function MatchDetailsSection({
  visibility,
  apontadorEmail,
  bracketType,
  venueId,
  publicMatchCode,
  temperature,
  humidity,
  tags,
  onVisibilityChange,
  onApontadorChange,
  onBracketChange,
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

      {/* APONTADOR */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Apontador (Email ou CPF)</h2>
          <input
            type="text"
            value={apontadorEmail}
            onChange={(e) => onApontadorChange(e.target.value)}
            placeholder="Ex: apontador@exemplo.com ou 12345678901"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </section>

      {/* TIPO DE CHAVE */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Tipo de Chave</h2>
          <div className="flex-1">
            <select
              value={bracketType}
              onChange={(e) => onBracketChange(e.target.value as 'ELIMINATION' | 'GROUPS' | 'SWISS' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
            >
              <option value="" className="text-gray-900">Selecione</option>
              <option value="ELIMINATION" className="text-gray-900">Eliminação Direta</option>
              <option value="GROUPS" className="text-gray-900">Grupos</option>
              <option value="SWISS" className="text-gray-900">Suíço</option>
            </select>
          </div>
        </div>
      </section>

      {/* LOCAL */}
      <section className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Local (ID)</h2>
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
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Código Público</h2>
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
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Condições Climáticas</h2>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => onTemperatureChange(e.target.value)}
                placeholder="Ex: 25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umidade (%)</label>
              <input
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
          <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">Tags (separadas por vírgula)</h2>
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
