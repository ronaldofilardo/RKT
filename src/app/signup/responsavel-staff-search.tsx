'use client';

import type { EntitySearchItem } from '@/app/api/entities/search/entities-search.logic';

interface ResponsavelStaffSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  items: EntitySearchItem[];
  searching: boolean;
  selectedId?: string;
  onSelect: (item: EntitySearchItem) => void;
}

/** Lista de resultados da busca no pool (CT ou treinador particular). */
export function ResponsavelStaffSearch({
  query,
  onQueryChange,
  items,
  searching,
  selectedId,
  onSelect,
}: ResponsavelStaffSearchProps) {
  return (
    <div>
      <label htmlFor="responsavel-staff-search" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
        Buscar por nome
      </label>
      <input
        id="responsavel-staff-search"
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Digite ao menos 2 letras"
        className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
      />
      <div className="mt-2 space-y-1 max-h-36 overflow-y-auto" aria-busy={searching}>
        {items.map((item) => (
          <button
            key={`${item.kind}-${item.id}`}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
              selectedId === item.id
                ? 'border-telemetry-blue bg-telemetry-blue/15 text-telemetry-text-primary ring-1 ring-telemetry-blue'
                : 'border-telemetry-border/30 bg-telemetry-elevated/30 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated/60'
            }`}
          >
            <strong>{item.name}</strong>
            {item.detail ? <span className="block text-[11px] text-telemetry-text-muted">{item.detail}</span> : null}
          </button>
        ))}
        {!searching && query.trim().length >= 2 && items.length === 0 && (
          <p className="text-[11px] text-telemetry-text-muted px-1">Nenhuma entidade encontrada.</p>
        )}
      </div>
    </div>
  );
}
