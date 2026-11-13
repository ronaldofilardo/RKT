import type { SetBreakdown } from '@/core/report/compute-stats';

// ---------------------------------------------------------------------------
// Tabs de navegação por set (Set Lens)
// ---------------------------------------------------------------------------
export function SetLensTabs({
  sets,
  selectedSet,
  onSelect,
}: {
  sets: SetBreakdown[];
  selectedSet: number;
  onSelect: (setNumber: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Navegação de sets">
      {sets.map((s) => {
        const isActive = s.setNumber === selectedSet;
        const scoreLabel = `${s.p1Games}-${s.p2Games}`;
        return (
          <button
            key={s.setNumber}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(s.setNumber)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? 'bg-telemetry-active border-2 border-telemetry-volt text-telemetry-text-primary shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                : 'bg-white/5 border border-white/10 text-telemetry-text-muted hover:bg-white/10'
            }`}
          >
            <span>Set {s.setNumber}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-telemetry-volt/20 text-telemetry-volt' : 'bg-black/30'}`}>
              {scoreLabel}
              {s.isTiebreak && ' (TB)'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
