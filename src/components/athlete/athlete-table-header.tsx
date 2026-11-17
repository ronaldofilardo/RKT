'use client';

import React from 'react';
import { AthleteTableSortIcon } from './athlete-table-sort-icon';
import type { AthleteSortField, AthleteSortState } from './athlete-table-sort.logic';

interface AthleteTableHeaderProps {
  selectable?: boolean;
  allSelected: boolean;
  showOrigin: boolean;
  sortState: AthleteSortState;
  onSelectAll?: (checked: boolean) => void;
  onSort: (field: AthleteSortField) => void;
}

export function AthleteTableHeader({
  selectable, allSelected, showOrigin, sortState, onSelectAll, onSort,
}: AthleteTableHeaderProps) {
  const getAriaSort = (field: AthleteSortField) => {
    if (sortState.field !== field) return 'none';
    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
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
        <th scope="col" aria-sort={getAriaSort('name')} className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">
          <button
            type="button"
            onClick={() => onSort('name')}
            aria-label="Ordenar por Nome"
            className="group inline-flex items-center gap-1.5 hover:text-telemetry-volt focus:outline-none cursor-pointer transition-colors"
            title="Ordenar por Nome"
          >
            <span>Nome</span>
            <AthleteTableSortIcon active={sortState.field === 'name'} direction={sortState.direction} />
          </button>
        </th>
        {showOrigin && (
          <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Origem</th>
        )}
        <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nickname</th>
        <th scope="col" aria-sort={getAriaSort('cpf')} className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">
          <button
            type="button"
            onClick={() => onSort('cpf')}
            aria-label="Ordenar por CPF"
            className="group inline-flex items-center gap-1.5 hover:text-telemetry-volt focus:outline-none cursor-pointer transition-colors"
            title="Ordenar por CPF"
          >
            <span>CPF</span>
            <AthleteTableSortIcon active={sortState.field === 'cpf'} direction={sortState.direction} />
          </button>
        </th>
        <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Gênero</th>
        <th className="px-3 pb-4 pt-4 text-sm font-bold text-telemetry-volt">Datas</th>
        <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Idade</th>
        <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Rankings</th>
        <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
        <th className="px-3 pb-4 pt-4 text-sm text-right text-telemetry-text-primary">Ações</th>
      </tr>
    </thead>
  );
}
