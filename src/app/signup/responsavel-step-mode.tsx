'use client';

import type { ResponsavelAccessMode } from './responsavel-onboarding-logic';

interface ResponsavelStepModeProps {
  accessMode: ResponsavelAccessMode;
  onSelect: (mode: ResponsavelAccessMode) => void;
  onNext: () => void;
}

const MODE_CARDS: {
  value: ResponsavelAccessMode;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    value: 'BASIC',
    emoji: '🛡️',
    title: 'Conta Básica de Acompanhamento',
    description:
      'Supervisão parental: quais partidas foram criadas e anotadas, quando e onde — sem placar ponto a ponto nem telemetria.',
  },
  {
    value: 'SPECTATOR',
    emoji: '🎾',
    title: 'Conta de Espectador & Responsável',
    description:
      'Tudo da Básica mais placar ao vivo, relatórios detalhados e permissão para criar e anotar as partidas do menor.',
  },
];

/** Etapa 1 do modal: escolha obrigatória entre Conta Básica e Espectador/Anotador. */
export function ResponsavelStepMode({ accessMode, onSelect, onNext }: ResponsavelStepModeProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-telemetry-text-primary">Como você quer acompanhar o menor?</h3>
        <p className="text-xs text-telemetry-text-muted mt-1">
          Você poderá ajustar o modo de acesso depois, no painel do responsável.
        </p>
      </div>
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" aria-label="Modo de acesso do responsável">
        <legend className="sr-only">Escolha o modo de acesso</legend>
        {MODE_CARDS.map((card) => {
          const selected = accessMode === card.value;
          return (
            <label
              key={card.value}
              htmlFor={`responsavel-mode-${card.value}`}
              className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                selected
                  ? 'border-telemetry-blue bg-telemetry-blue/15 ring-1 ring-telemetry-blue text-telemetry-text-primary'
                  : 'border-telemetry-border/30 bg-telemetry-elevated/40 hover:bg-telemetry-elevated/70 text-telemetry-text-primary'
              }`}
            >
              <input
                id={`responsavel-mode-${card.value}`}
                type="radio"
                name="responsavel-access-mode"
                value={card.value}
                checked={selected}
                onChange={() => onSelect(card.value)}
                className="sr-only"
              />
              <span className="text-xs font-bold block text-telemetry-text-primary">
                {card.emoji} {card.title}
              </span>
              <span className="text-[11px] text-telemetry-text-muted block mt-1 leading-relaxed">{card.description}</span>
            </label>
          );
        })}
      </fieldset>
      <button
        type="button"
        onClick={onNext}
        className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
      >
        Continuar
      </button>
    </div>
  );
}
