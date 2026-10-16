'use client';

import { VISIBILITY_OPTIONS } from '../matchConstants';
import { DetailsField, DetailTextInput, DetailTextarea } from './match-details-section-fields';
import { WeatherFields } from './match-details-section-weather';

interface MatchDetailsSectionProps {
  visibility: string;
  anotadorEmail: string;
  venueId: string;
  publicMatchCode: string;
  temperature: string;
  humidity: string;
  tags: string;
  details: string;
  onVisibilityChange: (value: string) => void;
  onAnotadorChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onPublicCodeChange: (value: string) => void;
  onTemperatureChange: (value: string) => void;
  onHumidityChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
}

export function MatchDetailsSection({
  visibility,
  anotadorEmail,
  venueId,
  publicMatchCode,
  temperature,
  humidity,
  tags,
  details,
  onVisibilityChange,
  onAnotadorChange,
  onVenueChange,
  onPublicCodeChange,
  onTemperatureChange,
  onHumidityChange,
  onTagsChange,
  onDetailsChange,
}: MatchDetailsSectionProps) {
  return (
    <>
      <DetailsField title="Visibilidade">
        <div className="flex-1">
          <select
            value={visibility}
            onChange={(e) => onVisibilityChange(e.target.value)}
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary [color-scheme:dark]"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-telemetry-elevated text-telemetry-text-primary">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </DetailsField>

      <DetailsField title="Anotador" optional>
        <DetailTextInput value={anotadorEmail} onChange={onAnotadorChange} placeholder="Ex: anotador@exemplo.com" />
      </DetailsField>

      <DetailsField title="Local (ID)" optional>
        <DetailTextInput value={venueId} onChange={onVenueChange} placeholder="ID do local" />
      </DetailsField>

      <DetailsField title="Código Público" optional>
        <DetailTextInput value={publicMatchCode} onChange={onPublicCodeChange} placeholder="Código único para localizar partida" />
      </DetailsField>

      <WeatherFields
        temperature={temperature}
        humidity={humidity}
        onTemperatureChange={onTemperatureChange}
        onHumidityChange={onHumidityChange}
      />

      <DetailsField title="Tags (separadas por vírgula)" optional>
        <DetailTextInput value={tags} onChange={onTagsChange} placeholder="Ex: juvenil, treino, amistoso" />
      </DetailsField>

      <DetailsField title="Detalhes" optional align="start">
        <DetailTextarea value={details} onChange={onDetailsChange} placeholder="Observações ou detalhes adicionais da partida" />
      </DetailsField>
    </>
  );
}
