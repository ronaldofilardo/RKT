'use client';

type ScopeValue = 'PUBLIC' | 'PRIVATE_CLUB' | 'PRIVATE_COACH' | 'PRIVATE_PLAYERS' | 'PRIVATE_PERSONAL';

interface MatchVisibilityFieldProps {
  visibility: string;
  eventScope?: ScopeValue;
  ctId?: string;
  isParticular?: boolean;
  onVisibilityChange: (value: string) => void;
  onPublicTemplateChange?: (value: boolean) => void;
  onEventScopeChange?: (scope: ScopeValue) => void;
}

export function MatchVisibilityField({
  visibility,
  eventScope,
  ctId,
  isParticular,
  onVisibilityChange,
  onPublicTemplateChange,
  onEventScopeChange,
}: MatchVisibilityFieldProps) {
  const circleScope: ScopeValue = ctId ? 'PRIVATE_CLUB' : isParticular ? 'PRIVATE_COACH' : 'PRIVATE_PLAYERS';
  const circleDesc = ctId
    ? 'Clube: gestor, treinadores do clube, atletas envolvidos (+ responsáveis) anotam sua versão isolada'
    : 'Você, atletas envolvidos (+ responsáveis) podem criar sua própria anotação isolada';

  const options = [
    {
      key: 'PLAYERS_ONLY',
      scope: 'PRIVATE_PERSONAL' as ScopeValue,
      isPublic: false,
      label: 'Privada',
      description: 'Só você anota e vê; ninguém mais encontra esta partida',
    },
    {
      key: 'CIRCLE',
      scope: circleScope,
      isPublic: false,
      label: 'Compartilhada no círculo',
      description: circleDesc,
    },
    {
      key: 'PUBLIC',
      scope: 'PUBLIC' as ScopeValue,
      isPublic: true,
      label: 'Pública',
      description: 'Aparece no pool público; qualquer usuário pode anotar a própria versão isolada',
    },
  ];

  const isCircle = eventScope === 'PRIVATE_CLUB' || eventScope === 'PRIVATE_COACH' || eventScope === 'PRIVATE_PLAYERS';

  return (
    <fieldset className="flex-1 space-y-2">
      <legend className="sr-only">Visibilidade da Partida</legend>
      {options.map((option) => {
        const id = `match-visibility-${option.key.toLowerCase()}`;
        const checked =
          option.key === 'CIRCLE'
            ? visibility === 'CIRCLE' || isCircle
            : option.key === 'PUBLIC'
              ? visibility === 'PUBLIC' || eventScope === 'PUBLIC'
              : visibility === 'PLAYERS_ONLY' && !isCircle && eventScope !== 'PUBLIC';

        return (
          <div
            key={option.key}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-telemetry-elevated p-3 hover:border-telemetry-volt/50"
          >
            <input
              id={id}
              type="radio"
              name="match-visibility"
              value={option.key}
              checked={checked}
              onChange={() => {
                onVisibilityChange(option.key);
                onPublicTemplateChange?.(option.isPublic);
                onEventScopeChange?.(option.scope);
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
