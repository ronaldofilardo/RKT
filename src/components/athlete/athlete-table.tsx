'use client';

import type { AthleteTableRowActions, AthleteTableRowData } from './athlete-table.types';
import { AthleteTableRow } from './athlete-table-row';

interface AthleteTableProps {
  athletes: AthleteTableRowData[];
  /** Monta as ações de cada linha (editar, excluir, link). */
  actions: (row: AthleteTableRowData) => AthleteTableRowActions;
  /** Exibe a coluna de seleção (usada pelo gestor para ações em lote). */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

export function AthleteTable({
  athletes, actions, selectable, selectedIds = [], onSelectChange, onSelectAll,
}: AthleteTableProps) {
  const allSelected = athletes.length > 0 && athletes.every((a) => selectedIds.includes(a.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left border-collapse">
        <thead>
          <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
            {selectable && (
              <th className="px-3 pb-4 pt-4 w-10">
                <input
                  id="atletas-select-all"
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
                />
              </th>
            )}
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nickname</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">CPF</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Gênero</th>
            <th className="px-3 pb-4 pt-4 text-sm font-bold text-telemetry-volt">Data de nascimento</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Idade</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Rankings</th>
            <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
            <th className="px-3 pb-4 pt-4 text-sm text-right text-telemetry-text-primary">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-telemetry-border/20">
          {athletes.map((row) => (
            <AthleteTableRow
              key={row.id}
              athlete={row}
              actions={actions(row)}
              selectable={selectable}
              selected={selectedIds.includes(row.id)}
              onSelect={(checked) => onSelectChange?.(row.id, checked)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
