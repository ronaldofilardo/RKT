'use client';

import type { DoublesFormation } from '@/core/scoring/types';

interface DoublesFormationModalProps {
  isOpen: boolean;
  selected: DoublesFormation | null;
  onSelect: (formation: DoublesFormation) => void;
  onCancel: () => void;
}

const FORMATION_OPTIONS: Array<{ value: DoublesFormation; label: string }> = [
  { value: '1_fundo_1_rede', label: '1 fundo e 1 rede' },
  { value: '2_fundo', label: '2 fundo' },
  { value: '2_rede', label: '2 rede' },
];

/**
 * Modal rápido (estilo ACE) exibido em partidas de duplas logo após
 * "Onde estava a DUPLA VENCEDORA?" (exceto em EF/ENF + Devolvendo).
 */
export function DoublesFormationModal({
  isOpen,
  selected,
  onSelect,
  onCancel,
}: DoublesFormationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-labelledby="doubles-formation-title"
      className="w-full rounded-xl border border-white/15 border-t-2 border-t-telemetry-volt bg-telemetry-card p-2.5 sm:p-3 shadow-lg animate-[fadeInSlideUp_0.2s_ease-out]"
    >
      <h2
        id="doubles-formation-title"
        className="text-center text-xs font-bold text-white mb-2"
      >
        Posição dos jogadores
      </h2>

      <div className="grid grid-cols-3 gap-1.5">
        {FORMATION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.value)}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold leading-tight transition-all flex items-center justify-center text-center min-h-[38px] ${
                isSelected
                  ? 'border-telemetry-volt bg-telemetry-volt/20 text-telemetry-volt shadow-[0_0_8px_rgba(var(--telemetry-volt)/0.3)]'
                  : 'border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-3 py-0.5 text-[11px] text-telemetry-text-muted hover:bg-white/5"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
