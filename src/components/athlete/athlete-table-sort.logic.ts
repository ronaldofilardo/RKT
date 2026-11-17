import type { AthleteTableRowData } from './athlete-table.types';

export type AthleteSortField = 'name' | 'cpf';
export type SortDirection = 'asc' | 'desc';

export interface AthleteSortState {
  field: AthleteSortField | null;
  direction: SortDirection;
}

export function nextSortState(
  current: AthleteSortState,
  clicked: AthleteSortField,
): AthleteSortState {
  if (current.field !== clicked) {
    return { field: clicked, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { field: clicked, direction: 'desc' };
  }
  return { field: null, direction: 'asc' };
}

function extractCpfKey(a: AthleteTableRowData): string {
  const raw = a.cpf || a.cpfLast2 || '';
  return raw.replace(/\D/g, '');
}

export function sortAthleteRows(
  items: AthleteTableRowData[],
  field: AthleteSortField | null,
  direction: SortDirection,
): AthleteTableRowData[] {
  if (!field) return items;

  return [...items].sort((a, b) => {
    if (field === 'name') {
      const cmp = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      return direction === 'asc' ? cmp : -cmp;
    }

    if (field === 'cpf') {
      const cpfA = extractCpfKey(a);
      const cpfB = extractCpfKey(b);

      if (!cpfA && !cpfB) {
        return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      }
      if (!cpfA) return 1;
      if (!cpfB) return -1;

      const cmp = cpfA.localeCompare(cpfB);
      if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    }

    return 0;
  });
}
