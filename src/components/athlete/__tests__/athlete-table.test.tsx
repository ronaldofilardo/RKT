/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AthleteTable } from '../athlete-table';
import type { AthleteTableRowData } from '../athlete-table.types';

const athlete: AthleteTableRowData = {
  id: 'p-1',
  name: 'Juca Balas',
  nickname: 'jukinha',
  cpf: '53051173991',
  gender: 'MALE',
  birthDate: '2009-10-01',
  age: 17,
  rankings: { CBT: { position: 5, category: '17-18' } },
  status: 'ACTIVE',
};

const noop = () => {};

function renderTable(overrides: Partial<AthleteTableRowData> = {}, selectable = false) {
  return render(
    <AthleteTable
      athletes={[{ ...athlete, ...overrides }]}
      actions={() => ({ onEdit: noop, onDelete: noop, onGenerateLink: noop, canDelete: true })}
      selectable={selectable}
      selectedIds={selectable ? ['p-1'] : []}
      onSelectChange={noop}
      onSelectAll={noop}
    />,
  );
}

describe('AthleteTable — colunas padrão (gestor e treinador)', () => {
  it('renderiza as 9 colunas na ordem acordada', () => {
    renderTable();
    const headers = Array.from(document.querySelectorAll('thead th')).map((th) => th.textContent);

    expect(headers).toEqual([
      'Nome', 'Nickname', 'CPF', 'Gênero', 'Data de nascimento',
      'Idade', 'Rankings', 'Status', 'Ações',
    ]);
  });

  it('não rende a coluna de seleção quando não é selecionável', () => {
    renderTable();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renderiza a coluna de seleção quando é selecionável', () => {
    renderTable({}, true);
    expect(screen.getByRole('checkbox', { name: 'Selecionar todos' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Selecionar Juca Balas' })).toBeChecked();
  });

  it('renderiza as ações Link, Editar e Excluir', () => {
    renderTable();

    expect(screen.getByRole('button', { name: /Link de acesso de/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir atleta/ })).toBeInTheDocument();
  });

  it('aplica o padrão de cores por coluna (nickname, nascimento e rankings)', () => {
    renderTable();

    const nickname = screen.getByText('@jukinha');
    expect(nickname.className).toContain('text-telemetry-volt');

    const birthDate = screen.getByText('01/10/2009');
    expect(birthDate.className).toContain('text-telemetry-text-primary');

    expect(screen.getByText('CBT #5 (17-18)')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });
});
