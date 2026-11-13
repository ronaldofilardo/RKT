'use client';

import type { ClubAnnotatorOption } from './group-club-matches.logic';

interface ClubMatchesFilterBarProps {
  annotators: ClubAnnotatorOption[];
  annotator: string;
  onlyDesignated: boolean;
  onAnnotatorChange: (val: string) => void;
  onOnlyDesignatedChange: (val: boolean) => void;
  onCreateMatch?: () => void;
}

export function ClubMatchesFilterBar({
  annotators,
  annotator,
  onlyDesignated,
  onAnnotatorChange,
  onOnlyDesignatedChange,
  onCreateMatch,
}: ClubMatchesFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Partidas do Clube</h2>
        <p className="text-xs text-telemetry-text-muted">Todas as anotações agrupadas pela partida de origem; privadas ao final</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-telemetry-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDesignated}
            onChange={(e) => onOnlyDesignatedChange(e.target.checked)}
            className="accent-telemetry-volt"
          />
          <span>Somente designado</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-telemetry-text-muted">
          Membro anotador
          <select
            value={annotator}
            onChange={(e) => onAnnotatorChange(e.target.value)}
            className="px-2 py-1 rounded-lg border border-white/10 bg-telemetry-elevated text-telemetry-text-primary [color-scheme:dark]"
          >
            <option value="">Todos</option>
            {annotators.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        {onCreateMatch && (
          <button
            type="button"
            onClick={onCreateMatch}
            className="px-3 py-1.5 rounded-lg bg-telemetry-blue hover:bg-telemetry-blue/80 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Nova Partida</span>
          </button>
        )}
      </div>
    </div>
  );
}
