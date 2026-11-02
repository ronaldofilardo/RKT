/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteRow } from '../athlete-row';
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

// `<tr>` precisa nascer dentro de tabela para não poluir o console com validateDOMNesting.
function renderRow(athlete: AthleteItem, onGenerateLink = noop) {
  return render(
    <table>
      <tbody>
        <AthleteRow
          athlete={athlete}
          selected={false}
          onSelect={noop}
          onEdit={noop}
          onGenerateLink={onGenerateLink}
        />
      </tbody>
    </table>,
  );
}

describe('AthleteRow - status e ação de senha', () => {
  it('mostra "Sem conta" e o título de criação de conta quando o atleta não tem User', () => {
    renderRow(makeAthlete());

    expect(screen.getByText('Sem conta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link Senha' })).toHaveAttribute(
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
    expect(screen.getByRole('button', { name: 'Link Senha' })).toHaveAttribute(
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

  it('dispara onGenerateLink ao clicar em "Link Senha" (inclusive sem conta)', () => {
    const onGenerateLink = jest.fn();
    renderRow(makeAthlete(), onGenerateLink);

    fireEvent.click(screen.getByRole('button', { name: 'Link Senha' }));
    expect(onGenerateLink).toHaveBeenCalledTimes(1);
  });
});
