'use client';

import type { HowPointEnded } from './usePointAnnotationFlow';

interface HowPointEndedBarProps {
  onSelect: (option: HowPointEnded) => void;
  onSelectFault: (type: 'out' | 'net') => void;
  selected: HowPointEnded | null;
  firstServeErrorRegistered: boolean;
  disabled?: boolean;
  activeFault?: 'out' | 'net' | null;
}

const RALLY_OPTIONS: Array<{ value: HowPointEnded; label: string }> = [
  { value: 'WINNER', label: 'WINNER' },
  { value: 'ERRO_FORCADO', label: 'ERRO FORÇADO' },
  { value: 'ERRO_NAO_FORCADO', label: 'ERRO NÃO FORÇADO' },
];

export function HowPointEndedBar({
  onSelect, onSelectFault, selected, firstServeErrorRegistered,
  disabled = false, activeFault,
}: HowPointEndedBarProps) {
  const isAceSelected = selected === 'ACE';
  const faultBtn = (type: 'out' | 'net') => {
    const isActive = activeFault === type;
    const activeCls = 'bg-telemetry-alert/40 border-telemetry-alert text-white shadow-[0_0_8px_rgba(var(--telemetry-alert)/0.3)]';
    const idleCls = 'bg-white/10 hover:bg-telemetry-alert/30 hover:border-telemetry-alert/50 border-transparent text-white';
    return (
      <button
        key={type} type="button" disabled={disabled} onClick={() => onSelectFault(type)}
        className={`rounded border py-0 text-[clamp(8px,1.1dvh,10px)] font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center min-h-[20px] sm:min-h-[24px] ${isActive ? activeCls : idleCls}`}
      >
        {type.toUpperCase()}
      </button>
    );
  };

  return (
    <section aria-label="Como terminou o ponto" className="rounded-xl bg-telemetry-card border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5">
      <h2 className="text-center text-[clamp(11px,1.5dvh,13px)] font-medium tracking-normal text-telemetry-text-muted mb-1">
        Como terminou o ponto?
      </h2>
      <div className="grid grid-cols-[0.65fr_1.35fr_1fr_1fr_1fr] gap-1 sm:gap-1.5 items-stretch">
        <button
          type="button" disabled={disabled} aria-pressed={isAceSelected} onClick={() => onSelect('ACE')}
          className={`rounded-lg border px-1 py-0.5 text-[clamp(9px,1.3dvh,12px)] font-semibold tracking-wide transition-all disabled:opacity-40 flex items-center justify-center min-h-[30px] sm:min-h-[36px] ${
            isAceSelected
              ? 'border-telemetry-volt bg-telemetry-volt/20 text-telemetry-volt shadow-[0_0_8px_rgba(var(--telemetry-volt)/0.3)]'
              : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
          }`}
        >
          ACE
        </button>

        <div className="flex flex-col items-center justify-between rounded-lg border border-white/10 bg-white/5 p-0.5 sm:p-1 transition-all">
          <span className="text-[clamp(7.5px,1dvh,9px)] font-medium tracking-normal text-white/80 leading-none mb-0.5 text-center truncate w-full">
            {firstServeErrorRegistered ? 'Dupla Falta' : 'Falta 1º saque'}
          </span>
          <div className="grid grid-cols-2 gap-0.5 sm:gap-1 w-full flex-1 items-stretch">
            {faultBtn('out')}
            {faultBtn('net')}
          </div>
        </div>

        {RALLY_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value} type="button" disabled={disabled} aria-pressed={isSelected} onClick={() => onSelect(opt.value)}
              className={`rounded-lg border px-1 py-0.5 text-[clamp(8.5px,1.2dvh,11px)] font-semibold leading-tight transition-all disabled:opacity-40 flex items-center justify-center text-center min-h-[30px] sm:min-h-[36px] ${
                isSelected
                  ? 'border-telemetry-alert bg-telemetry-alert/15 text-white'
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
