'use client';

import { DetailsField, DetailTextInput, DetailTextarea } from './match-details-section-fields';
import { MatchVisibilityField } from './MatchVisibilityField';
import { WeatherFields } from './match-details-section-weather';

interface MatchDetailsSectionProps {
  visibility: string;
  eventScope?: 'PUBLIC' | 'PRIVATE_CLUB' | 'PRIVATE_COACH' | 'PRIVATE_PLAYERS' | 'PRIVATE_PERSONAL';
  ctId?: string;
  isParticular?: boolean;
  anotadorEmail: string;
  venueId: string;
  publicMatchCode: string;
  temperature: string;
  humidity: string;
  tags: string;
  details: string;
  onVisibilityChange: (value: string) => void;
  onPublicTemplateChange?: (value: boolean) => void;
  onEventScopeChange?: (scope: 'PUBLIC' | 'PRIVATE_CLUB' | 'PRIVATE_COACH' | 'PRIVATE_PLAYERS' | 'PRIVATE_PERSONAL') => void;
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
  eventScope,
  ctId,
  isParticular,
  anotadorEmail,
  venueId,
  publicMatchCode,
  temperature,
  humidity,
  tags,
  details,
  onVisibilityChange,
  onPublicTemplateChange,
  onEventScopeChange,
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
      <DetailsField title="Visibilidade" align="start">
        <MatchVisibilityField
          visibility={visibility}
          eventScope={eventScope}
          ctId={ctId}
          isParticular={isParticular}
          onVisibilityChange={onVisibilityChange}
          onPublicTemplateChange={onPublicTemplateChange}
          onEventScopeChange={onEventScopeChange}
        />
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
