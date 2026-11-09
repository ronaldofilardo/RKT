'use client';

interface MatchVisibilityFieldProps {
  visibility: string;
  onVisibilityChange: (value: string) => void;
  /** Marca/desmarca a partida como template do pool público. */
  onPublicTemplateChange?: (value: boolean) => void;
}

const OPTIONS = [
  {
    value: 'PLAYERS_ONLY',
    label: 'Privada',
    description: 'Só você anota; ninguém mais encontra esta partida',
  },
  {
    value: 'PUBLIC',
    label: 'Pública',
    description: 'Aparece no pool público; qualquer usuário pode anotar a própria versão',
  },
] as const;

export function MatchVisibilityField({
  visibility,
  onVisibilityChange,
  onPublicTemplateChange,
}: MatchVisibilityFieldProps) {
  return (
    <fieldset className="flex-1 space-y-2">
      <legend className="sr-only">Visibilidade da Partida</legend>
      {OPTIONS.map((option) => {
        const id = `match-visibility-${option.value.toLowerCase()}`;
        return (
          <div
            key={option.value}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-telemetry-elevated p-3 hover:border-telemetry-volt/50"
          >
            <input
              id={id}
              type="radio"
              name="match-visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={(e) => {
                onVisibilityChange(e.target.value);
                onPublicTemplateChange?.(e.target.value === 'PUBLIC');
              }}
              className="mt-1 accent-telemetry-volt"
            />
            <div className="flex flex-col">
              <label htmlFor={id} className="text-sm font-semibold text-telemetry-text-primary cursor-pointer">
                {option.label}
              </label>
              <span className="text-xs text-telemetry-text-muted">{option.description}</span>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
