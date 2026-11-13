// Cabeçalho + filtros do Fio do Jogo (seletor de set e comprimento mínimo)
export function FioDoJogoFilters({
  selectedSetFilter,
  onSelectSet,
  minRunLength,
  onToggleMinRunLength,
  availableSets,
}: {
  selectedSetFilter: number | 'ALL';
  onSelectSet: (set: number | 'ALL') => void;
  minRunLength: number;
  onToggleMinRunLength: () => void;
  availableSets: number[];
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <div className="text-xs text-telemetry-text-muted">
          Mapeamento horizontal das sequências de domínio e do ritmo da partida
        </div>
      </div>

      {/* Filtros por set e comprimento mínimo */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Seletor de Sets */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onSelectSet('ALL')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              selectedSetFilter === 'ALL'
                ? 'bg-telemetry-active text-telemetry-volt border border-telemetry-volt/40'
                : 'text-telemetry-text-muted hover:text-white'
            }`}
          >
            Partida Toda
          </button>
          {availableSets.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelectSet(s)}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                selectedSetFilter === s
                  ? 'bg-telemetry-active text-telemetry-volt border border-telemetry-volt/40'
                  : 'text-telemetry-text-muted hover:text-white'
              }`}
            >
              Set {s}
            </button>
          ))}
        </div>

        {/* Toggle de Runs Mínimos */}
        <button
          type="button"
          onClick={onToggleMinRunLength}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-telemetry-text-muted font-medium transition-colors"
        >
          {minRunLength === 2 ? 'Exibindo: 2+ pts' : 'Exibindo: 3+ pts (Grandes Runs)'}
        </button>
      </div>
    </div>
  );
}
