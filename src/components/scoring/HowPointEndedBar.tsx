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
        className={`rounded border py-0.5 text-[clamp(9px,1.3dvh,11px)] font-black transition-all active:scale-95 flex items-center justify-center ${isActive ? activeCls : idleCls}`}
      >
        {type.toUpperCase()}
      </button>
    );
  };

  return (
    <section aria-label="Como terminou o ponto" className="rounded-xl bg-telemetry-card border border-white/10 px-3 py-2">
      <h2 className="text-center text-[clamp(13px,1.9dvh,17px)] font-semibold tracking-tight mb-2">
        Como terminou o ponto?
      </h2>
      <div className="grid grid-cols-5 gap-1.5 items-stretch">
        <button
          type="button" disabled={disabled} aria-pressed={isAceSelected} onClick={() => onSelect('ACE')}
          className={`rounded-lg border px-1 py-1 text-[clamp(10px,1.5dvh,13px)] font-bold transition-all disabled:opacity-40 flex items-center justify-center ${
            isAceSelected
              ? 'border-telemetry-volt bg-telemetry-volt/20 text-telemetry-volt shadow-[0_0_8px_rgba(var(--telemetry-volt)/0.3)]'
              : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
          }`}
        >
          ACE
        </button>

        <div className="flex flex-col items-center justify-between rounded-lg border border-white/10 bg-white/5 p-1 transition-all">
          <span className="text-[clamp(8px,1.1dvh,10px)] font-bold tracking-tight text-white/80 leading-none mb-1 text-center truncate w-full">
            {firstServeErrorRegistered ? 'Dupla Falta' : 'Falta 1º saque'}
          </span>
          <div className="grid grid-cols-2 gap-1 w-full flex-1 items-stretch">
            {faultBtn('out')}
            {faultBtn('net')}
          </div>
        </div>

        {RALLY_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value} type="button" disabled={disabled} aria-pressed={isSelected} onClick={() => onSelect(opt.value)}
              className={`rounded-lg border px-1 py-1 text-[clamp(10px,1.5dvh,13px)] font-semibold leading-tight transition-all disabled:opacity-40 flex items-center justify-center ${
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
