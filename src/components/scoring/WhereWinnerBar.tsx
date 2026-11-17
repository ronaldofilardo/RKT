'use client';

import type { HowPointEnded, WhereWinner } from './usePointAnnotationFlow';

interface WhereWinnerBarProps {
  onSelect: (option: WhereWinner) => void;
  selected: WhereWinner | null;
  onBack?: () => void;
  disabled?: boolean;
  howEnded?: HowPointEnded | null;
}

const DEFAULT_OPTIONS: Array<{ value: WhereWinner; label: string; disabledOption?: boolean }> = [
  { value: 'devolvendo', label: 'Devolvendo' },
  { value: 'fundo', label: 'Fundo de quadra' },
  { value: 'voleio', label: 'Voleando (na rede)' },
  { value: 'passando', label: 'Passando o jogador da rede' },
];

const ERROR_OPTIONS: Array<{ value: WhereWinner; label: string; disabledOption?: boolean }> = [
  { value: 'devolvendo', label: 'Devolvendo', disabledOption: true },
  { value: 'sacando', label: 'Sacando', disabledOption: false },
  { value: 'fundo', label: 'Fundo de quadra', disabledOption: false },
  { value: 'voleio', label: 'Voleando (na rede)', disabledOption: false },
  { value: 'passando', label: 'Passando o jogador da rede', disabledOption: false },
];

export function WhereWinnerBar({ onSelect, selected, disabled = false, howEnded }: WhereWinnerBarProps) {
  const isError = howEnded === 'ERRO_FORCADO' || howEnded === 'ERRO_NAO_FORCADO';
  const options = isError ? ERROR_OPTIONS : DEFAULT_OPTIONS;

  return (
    <section
      aria-label="Onde estava o vencedor do ponto"
      className={`rounded-xl bg-telemetry-card border border-white/10 px-1.5 sm:px-3 py-1 sm:py-1.5 transition-all ${disabled ? 'opacity-40 pointer-events-none cursor-not-allowed select-none' : 'opacity-100 ring-1 ring-white/10'
        }`}
    >
      <h2 className="text-center text-[clamp(10.5px,1.4dvh,12.5px)] font-medium mb-1">
        Onde estava o <strong className="font-bold">VENCEDOR</strong> do ponto?
      </h2>
      <div className={`grid gap-1 sm:gap-1.5 ${isError ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          const isBtnDisabled = disabled || Boolean(opt.disabledOption);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isBtnDisabled}
              aria-pressed={isSelected}
              onClick={() => !isBtnDisabled && onSelect(opt.value)}
              className={`rounded-lg border px-0.5 sm:px-1 py-1 text-[clamp(7.5px,1.1dvh,10.5px)] font-semibold leading-tight transition-all flex items-center justify-center text-center min-h-[30px] sm:min-h-[36px] ${isBtnDisabled
                ? 'opacity-35 cursor-not-allowed border-white/5 bg-white/[0.02] text-telemetry-text-muted select-none'
                : isSelected
                  ? 'border-telemetry-alert bg-telemetry-alert/15 text-white shadow-[0_0_8px_rgba(var(--telemetry-alert)/0.3)]'
                  : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
