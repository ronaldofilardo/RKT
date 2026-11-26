'use client';

import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { AthleteTableRowActions, AthleteTableRowData } from './athlete-table.types';
import { AthleteTableRow } from './athlete-table-row';
import { AthleteMobileCard } from './athlete-mobile-card';
import { AthleteTableHeader } from './athlete-table-header';
import {
  nextSortState,
  sortAthleteRows,
  type AthleteSortState,
} from './athlete-table-sort.logic';

interface AthleteTableProps {
  athletes: AthleteTableRowData[];
  actions: (row: AthleteTableRowData) => AthleteTableRowActions;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

export function AthleteTable({
  athletes, actions, selectable, selectedIds = [], onSelectChange, onSelectAll,
}: AthleteTableProps) {
  const isMobile = useIsMobile();
  const [sortState, setSortState] = useState<AthleteSortState>({ field: null, direction: 'asc' });
  const sortedAthletes = useMemo(
    () => sortAthleteRows(athletes, sortState.field, sortState.direction),
    [athletes, sortState.field, sortState.direction],
  );

  const allSelected = sortedAthletes.length > 0 && sortedAthletes.every((a) => selectedIds.includes(a.id));
  const showOrigin = sortedAthletes.some((a) => Boolean(a.origin));

  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedAthletes.map((row) => (
          <AthleteMobileCard
            key={row.id} athlete={row} actions={actions(row)} selectable={selectable} showOrigin={showOrigin}
            selected={selectedIds.includes(row.id)} onSelect={(checked) => onSelectChange?.(row.id, checked)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left border-collapse">
        <AthleteTableHeader
          selectable={selectable}
          allSelected={allSelected}
          showOrigin={showOrigin}
          sortState={sortState}
          onSelectAll={onSelectAll}
          onSort={(f) => setSortState((prev) => nextSortState(prev, f))}
        />
        <tbody className="divide-y divide-telemetry-border/20">
          {sortedAthletes.map((row) => (
            <AthleteTableRow
              key={row.id}
              athlete={row}
              actions={actions(row)}
              selectable={selectable}
              showOrigin={showOrigin}
              selected={selectedIds.includes(row.id)}
              onSelect={(checked) => onSelectChange?.(row.id, checked)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
