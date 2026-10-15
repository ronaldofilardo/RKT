'use client';

interface MatchNewErrorBannerProps {
  error: string | null;
  missingFields: string[];
}

/** Banner de erro de criação da partida com lista de campos faltantes. */
export function MatchNewErrorBanner({ error, missingFields }: MatchNewErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-sm rounded-lg flex items-start gap-2">
      <span className="text-telemetry-alert mt-0.5">⚠️</span>
      <div>
        <p className="font-medium">Erro</p>
        <p>{error}</p>
        {missingFields.length > 0 && (
          <ul className="mt-1 text-xs text-telemetry-alert list-disc list-inside opacity-90">
            {missingFields.map((f) => (
              <li key={f}>Falta: {f}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
