import { DetailsField, DetailTextInput } from './match-details-section-fields';

interface WeatherFieldsProps {
  temperature: string;
  humidity: string;
  onTemperatureChange: (value: string) => void;
  onHumidityChange: (value: string) => void;
}

export function WeatherFields({
  temperature,
  humidity,
  onTemperatureChange,
  onHumidityChange,
}: WeatherFieldsProps) {
  return (
    <DetailsField title="Condições Climáticas" optional>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div>
          <label htmlFor="match-temperature" className="block text-sm font-medium text-telemetry-text-muted mb-1">Temperatura (°C)</label>
          <DetailTextInput
            id="match-temperature"
            type="number"
            value={temperature}
            onChange={onTemperatureChange}
            placeholder="Ex: 25"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
          />
        </div>
        <div>
          <label htmlFor="match-humidity" className="block text-sm font-medium text-telemetry-text-muted mb-1">Umidade (%)</label>
          <DetailTextInput
            id="match-humidity"
            type="number"
            value={humidity}
            onChange={onHumidityChange}
            placeholder="Ex: 60"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
          />
        </div>
      </div>
    </DetailsField>
  );
}
