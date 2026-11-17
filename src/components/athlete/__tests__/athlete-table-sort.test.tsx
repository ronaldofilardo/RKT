/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteTable } from '../athlete-table';
import type { AthleteTableRowData } from '../athlete-table.types';
import {
  nextSortState,
  sortAthleteRows,
  type AthleteSortState,
} from '../athlete-table-sort.logic';

const noop = () => {};

const mockAthletes: AthleteTableRowData[] = [
  { id: '1', name: 'Zeca Silva', cpf: '33333333333', status: 'ACTIVE' },
  { id: '2', name: 'Ana Souza', cpf: '11111111111', status: 'ACTIVE' },
  { id: '3', name: 'Carlos Lima', cpf: '22222222222', status: 'ACTIVE' },
  { id: '4', name: 'Bernardo Sem Cpf', cpf: null, cpfLast2: null, status: 'ACTIVE' },
];

describe('athlete-table-sort.logic', () => {
  it('alterna o estado de ordenação corretamente (asc -> desc -> null)', () => {
    let state: AthleteSortState = { field: null, direction: 'asc' };

    state = nextSortState(state, 'name');
    expect(state).toEqual({ field: 'name', direction: 'asc' });

    state = nextSortState(state, 'name');
    expect(state).toEqual({ field: 'name', direction: 'desc' });

    state = nextSortState(state, 'name');
    expect(state).toEqual({ field: null, direction: 'asc' });
  });

  it('ordena atletas por nome (asc e desc)', () => {
    const asc = sortAthleteRows(mockAthletes, 'name', 'asc');
    expect(asc.map((a) => a.name)).toEqual([
      'Ana Souza',
      'Bernardo Sem Cpf',
      'Carlos Lima',
      'Zeca Silva',
    ]);

    const desc = sortAthleteRows(mockAthletes, 'name', 'desc');
    expect(desc.map((a) => a.name)).toEqual([
      'Zeca Silva',
      'Carlos Lima',
      'Bernardo Sem Cpf',
      'Ana Souza',
    ]);
  });

  it('ordena atletas por CPF colocando registros sem CPF no final', () => {
    const asc = sortAthleteRows(mockAthletes, 'cpf', 'asc');
    expect(asc.map((a) => a.id)).toEqual(['2', '3', '1', '4']);

    const desc = sortAthleteRows(mockAthletes, 'cpf', 'desc');
    expect(desc.map((a) => a.id)).toEqual(['1', '3', '2', '4']);
  });
});

describe('AthleteTable - interação de ordenação', () => {
  function renderComponent() {
    return render(
      <AthleteTable
        athletes={mockAthletes}
        actions={() => ({ onEdit: noop, onDelete: noop, canDelete: true })}
      />,
    );
  }

  it('ordena a tabela ao clicar no cabeçalho de Nome', () => {
    renderComponent();
    const btnNome = screen.getByRole('button', { name: /ordenar por nome/i });

    // 1º clique: asc
    fireEvent.click(btnNome);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Ana Souza');

    // 2º clique: desc
    fireEvent.click(btnNome);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zeca Silva');
  });

  it('ordena a tabela ao clicar no cabeçalho de CPF', () => {
    renderComponent();
    const btnCpf = screen.getByRole('button', { name: /ordenar por cpf/i });

    // 1º clique: asc
    fireEvent.click(btnCpf);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Ana Souza'); // cpf 111...

    // 2º clique: desc
    fireEvent.click(btnCpf);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zeca Silva'); // cpf 333...
  });
});
