'use client';

interface SetSummaryHeaderProps {
  selectedSet: number;
  durationMinutes?: number;
  availableSets: number[];
  onSelectSet: (setNumber: number) => void;
  onClose: () => void;
}

/** Cabeçalho do modal (badge, duração, título) e abas de seleção de set. */
export function SetSummaryHeader({
  selectedSet,
  durationMinutes,
  availableSets,
  onSelectSet,
  onClose,
}: SetSummaryHeaderProps) {
  return (
    <>
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-telemetry-elevated/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-telemetry-volt px-2 py-0.5 rounded bg-telemetry-volt/10 border border-telemetry-volt/20">
              Análise do Set
            </span>
            {durationMinutes && (
              <span className="text-xs text-telemetry-text-muted">
                ⏱ {durationMinutes} min
              </span>
            )}
          </div>
          <h2 id="set-summary-title" className="text-lg font-bold text-telemetry-text-primary mt-1">
            Resumo do {selectedSet}º Set
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar resumo"
          className="p-1.5 rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated transition-colors"
        >
          ✕
        </button>
      </div>

      {availableSets.length > 1 && (
        <div className="flex border-b border-white/10 bg-telemetry-elevated/40 px-3 pt-2 gap-1">
          {availableSets.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelectSet(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
                selectedSet === s
                  ? 'bg-telemetry-card text-telemetry-text-primary border-t border-x border-white/15 shadow-sm'
                  : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
              }`}
            >
              Set {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
