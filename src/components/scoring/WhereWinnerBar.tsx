'use client';

import type { WhereWinner } from './usePointAnnotationFlow';

interface WhereWinnerBarProps {
  onSelect: (option: WhereWinner) => void;
  selected: WhereWinner | null;
  onBack?: () => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: WhereWinner; label: string }> = [
  { value: 'devolvendo', label: 'Devolvendo' },
  { value: 'fundo', label: 'Fundo de quadra' },
  { value: 'voleio', label: 'Voleando (na rede)' },
  { value: 'passando', label: 'Passando o jogador da rede' },
];

export function WhereWinnerBar({ onSelect, selected, disabled = false }: WhereWinnerBarProps) {
  return (
    <section
      aria-label="Onde estava o vencedor do ponto"
      className={`rounded-xl bg-telemetry-card border border-white/10 px-3 py-2 transition-all ${
        disabled ? 'opacity-40 pointer-events-none cursor-not-allowed select-none' : 'opacity-100 ring-1 ring-white/10'
      }`}
    >
      <h2 className="text-center text-[clamp(12px,1.7dvh,15px)] font-medium mb-2">
        Onde estava o <strong className="font-bold">VENCEDOR</strong> do ponto?
      </h2>
      <div className="grid grid-cols-4 gap-1.5">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.value)}
              className={`rounded-lg border px-1 py-2 text-[clamp(10px,1.5dvh,13px)] font-semibold leading-tight transition-all ${
                disabled
                  ? 'cursor-not-allowed'
                  : isSelected
                  ? 'border-telemetry-blue bg-telemetry-blue/20'
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
