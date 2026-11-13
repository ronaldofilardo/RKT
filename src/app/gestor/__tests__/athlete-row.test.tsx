/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteTable } from '@/components/athlete/athlete-table';
import { toAthleteTableRow } from '../athlete-row-data';
import type { AthleteItem } from '../types';

function makeAthlete(overrides: Partial<AthleteItem['player']> = {}): AthleteItem {
  return {
    player: {
      id: 'p-1',
      name: 'Atleta',
      cpf: '52998224725',
      email: null,
      birthDate: '1990-07-04T00:00:00.000Z',
      gender: 'MASCULINO',
      dominance: 'DESTRO',
      user: null,
      ...overrides,
    },
  };
}

const noop = () => {};

function renderRow(item: AthleteItem, onGenerateLink = noop) {
  return render(
    <AthleteTable
      athletes={[toAthleteTableRow(item)]}
      actions={() => ({
        onEdit: noop,
        onDelete: noop,
        onGenerateLink,
        canDelete: true,
        hasAccount: Boolean(item.player.user),
      })}
    />,
  );
}

describe('AthleteTable (gestor) - status e ação de senha', () => {
  it('mostra "Sem conta" e o título de criação de conta quando o atleta não tem User', () => {
    renderRow(makeAthlete());

    expect(screen.getByText('Sem conta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Link de acesso de/ })).toHaveAttribute(
      'title',
      'Criar conta de acesso e gerar link de senha',
    );
  });

  it('mostra "Senha pendente" quando o atleta tem conta com senha provisória', () => {
    renderRow(
      makeAthlete({
        user: { id: 'u-1', name: 'Atleta', cpf: '52998224725', email: 'a@b.com', mustChangePassword: true },
      }),
    );

    expect(screen.getByText('Senha pendente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Link de acesso de/ })).toHaveAttribute(
      'title',
      'Gerar link de redefinição de senha',
    );
  });

  it('mostra "Ativo" quando o atleta tem conta sem senha pendente', () => {
    renderRow(
      makeAthlete({
        user: { id: 'u-1', name: 'Atleta', cpf: '52998224725', email: 'a@b.com', mustChangePassword: false },
      }),
    );

    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('dispara onGenerateLink ao clicar em "Link" (inclusive sem conta)', () => {
    const onGenerateLink = jest.fn();
    renderRow(makeAthlete(), onGenerateLink);

    fireEvent.click(screen.getByRole('button', { name: /Link de acesso de/ }));
    expect(onGenerateLink).toHaveBeenCalledTimes(1);
  });

  it('exibe o nickname formatado com @ quando presente', () => {
    renderRow(makeAthlete({ nickname: 'joaosilva' }));
    expect(screen.getByText('@joaosilva')).toBeInTheDocument();
  });

  it('exibe hífen quando não possui nickname', () => {
    renderRow(makeAthlete({ nickname: null }));
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('exibe a coluna de rankings com os rótulos formatados', () => {
    renderRow(makeAthlete({ rankings: { CBT: { position: 5, category: '17-18' } } }));
    expect(screen.getByText('CBT #5 (17-18)')).toBeInTheDocument();
  });

  it('formata o CPF da coluna', () => {
    renderRow(makeAthlete({ cpf: '52998224725' }));
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument();
  });

  it('exibe o botão Excluir quando a linha permite remoção', () => {
    renderRow(makeAthlete());
    expect(screen.getByRole('button', { name: /Excluir atleta/ })).toBeInTheDocument();
  });
});
