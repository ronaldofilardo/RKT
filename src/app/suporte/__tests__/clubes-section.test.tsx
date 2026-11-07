/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClubesSection } from '../clubes-section';
import type { TrainingCenter, CtStatusFilter } from '../types';

function makeCt(overrides: Partial<TrainingCenter> = {}): TrainingCenter {
  return {
    id: 'ct1', name: 'Clube Padrão', slug: 'clube-padrao', status: 'ACTIVE',
    cnpj: '84967753800121', legalName: 'Razão Social LTDA', phone: null, email: null,
    address: null, legalRepName: null, legalRepCpf: null, legalRepEmail: null, legalRepPhone: null,
    ...overrides,
  };
}

const active = makeCt({ id: 'ct-a', name: 'Clube Ativo', status: 'ACTIVE' });
const suspended = makeCt({ id: 'ct-s', name: 'Clube Suspenso', status: 'SUSPENDED' });

const onApprove = jest.fn();
const onSuspend = jest.fn();
const onReactivate = jest.fn();
const onEditClub = jest.fn();
const onFilterChange = jest.fn();

function renderSection(clubs: TrainingCenter[], filter: CtStatusFilter = 'ALL') {
  return render(
    <ClubesSection
      clubs={clubs} filter={filter} onFilterChange={onFilterChange}
      onApprove={onApprove} onSuspend={onSuspend} onReactivate={onReactivate} onEditClub={onEditClub}
    />
  );
}

describe('ClubesSection (aba Clubes e CTs)', () => {
  it('exibe cabeçalho, subtítulo e colunas da tabela', () => {
    renderSection([]);
    expect(screen.getByText('Gestão de Clubes e CTs')).toBeInTheDocument();
    expect(screen.getByText('Aprovação, bloqueio e edição cadastral de clubes')).toBeInTheDocument();
    for (const col of ['Clube / CT', 'CNPJ', 'Razão Social', 'Status', 'Ações']) {
      expect(screen.getByText(col)).toBeInTheDocument();
    }
  });

  it('exibe os 3 chips de filtro de status', () => {
    renderSection([]);
    for (const chip of ['Ativos', 'Bloqueados', 'Todos']) {
      expect(screen.getByRole('button', { name: chip })).toBeInTheDocument();
    }
  });

  it('destaca o chip do filtro ativo com fundo azul translúcido', () => {
    const { container } = renderSection([], 'ACTIVE');
    const ativos = screen.getByRole('button', { name: 'Ativos' });
    const todos = screen.getByRole('button', { name: 'Todos' });
    expect(ativos.className).toContain('bg-telemetry-blue/10');
    expect(todos.className).not.toContain('bg-telemetry-blue/10');
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('filtra clubes pelo status selecionado', () => {
    renderSection([active, suspended], 'ACTIVE');
    expect(screen.getByText('Clube Ativo')).toBeInTheDocument();
    expect(screen.queryByText('Clube Suspenso')).not.toBeInTheDocument();
  });

  it('exibe badge de status para cada situação', () => {
    renderSection([active, suspended], 'ALL');
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
  });

  it('exibe a ação adequada ao status, além de Editar sempre', () => {
    renderSection([active, suspended], 'ALL');
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bloquear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desbloquear' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
  });

  it('dispara os callbacks com o id do clube', () => {
    renderSection([active, suspended], 'ALL');
    fireEvent.click(screen.getByRole('button', { name: 'Bloquear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desbloquear' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(onSuspend).toHaveBeenCalledWith('ct-a');
    expect(onReactivate).toHaveBeenCalledWith('ct-s');
    expect(onEditClub).toHaveBeenCalledWith(expect.objectContaining({ id: 'ct-a' }));
  });

  it('notifica mudança de filtro ao clicar em um chip', () => {
    renderSection([], 'ACTIVE');
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(onFilterChange).toHaveBeenCalledWith('ALL');
  });

  it('exibe "-" quando CNPJ e razão social estão ausentes', () => {
    renderSection([makeCt({ cnpj: null, legalName: null })], 'ALL');
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
  });

  it('exibe estado vazio quando nenhum clube corresponde ao filtro', () => {
    renderSection([], 'ACTIVE');
    expect(screen.getByText('Nenhum clube encontrado nesta categoria.')).toBeInTheDocument();
  });
});
