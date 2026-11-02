/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AthletesTable } from '../athletes-table';
import type { AthleteItem } from '../types';

const toastMock = jest.fn();

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: (...args: unknown[]) => toastMock(...args) }),
}));

function makeAthlete(): AthleteItem {
  return {
    player: {
      id: 'p-2',
      name: 'Marcos',
      cpf: '52998224725',
      email: null,
      birthDate: '1990-07-04T00:00:00.000Z',
      gender: 'MASCULINO',
      dominance: 'DESTRO',
      user: null,
    },
  };
}

function renderTable() {
  return render(
    <AthletesTable
      athletes={[makeAthlete()]}
      selectedIds={[]}
      onSelectChange={jest.fn()}
      onSelectAll={jest.fn()}
      onCreateAthlete={jest.fn()}
      onRefresh={jest.fn()}
    />,
  );
}

describe('AthletesTable - botão "Link Senha"', () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  afterEach(() => {
    delete (global as { fetch?: unknown }).fetch;
  });

  it('chama o regenerate-link do atleta (mesmo sem conta) e abre o modal com o link', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'token-abc', expiresAt: '2026-11-08T00:00:00.000Z' }),
    });
    (global as { fetch?: unknown }).fetch = fetchMock;

    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Link Senha' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/gestor/athletes/p-2/regenerate-link', { method: 'POST' }),
    );
    expect(await screen.findByText('Link de Redefinição de Senha')).toBeInTheDocument();
    expect(screen.getByText(/trocar-senha\?token=token-abc/)).toBeInTheDocument();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('exibe a mensagem do servidor quando o atleta não pode receber o link', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'VALIDATION_ERROR', message: 'Informe o CPF do atleta em "Editar" antes de gerar o link de senha.' }),
    });
    (global as { fetch?: unknown }).fetch = fetchMock;

    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Link Senha' }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: expect.stringContaining('Informe o CPF do atleta') }),
    );
    expect(screen.queryByText('Link de Redefinição de Senha')).not.toBeInTheDocument();
  });
});
