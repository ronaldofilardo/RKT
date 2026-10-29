/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShareSpectateModal } from '../ShareSpectateModal';

describe('ShareSpectateModal', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders initial create state according to wireframe', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ spectators: [] }),
    });

    await act(async () => {
      render(
        <ShareSpectateModal
          matchId="m1"
          isOpen={true}
          onClose={jest.fn()}
          matchContext="Ana Souza × Bia Lima · Quadra 2"
        />
      );
    });

    expect(screen.getByText('Compartilhar partida')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza × Bia Lima · Quadra 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Rótulo do convite')).toBeInTheDocument();
    expect(screen.getByText('Quem recebe vê placar e pontos em tempo real.')).toBeInTheDocument();
    expect(screen.getByText('Comentários, notas e áudios ficam privados.')).toBeInTheDocument();
    expect(screen.getByText('Acesso termina 7 dias após o fim da partida.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar convite' })).toBeInTheDocument();
  });

  it('transitions to created state with watchers list and revoke button', async () => {
    global.fetch = jest.fn().mockImplementation((url, opts) => {
      if (url.includes('/share-links') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            linkId: 'l1',
            url: 'http://localhost:3000/matches/convite/Xk9fQ2vL8aTn',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          spectators: [
            { id: 's1', userId: 'u1', label: 'Carlos (pai)', isOnline: true },
            { id: 's2', userId: 'u2', user: { name: 'Marta (tia)' }, isOnline: false },
          ],
        }),
      });
    });

    render(
      <ShareSpectateModal
        matchId="m1"
        isOpen={true}
        onClose={jest.fn()}
        matchContext="Ana Souza × Bia Lima · Quadra 2"
      />
    );

    const input = screen.getByLabelText('Rótulo do convite');
    fireEvent.change(input, { target: { value: 'Pai da Ana' } });

    const submitBtn = screen.getByRole('button', { name: 'Criar convite' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Convite criado')).toBeInTheDocument();
    });

    expect(screen.getByText('…/matches/convite/Xk9fQ2vL8aTn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByText('O link aparece só agora. Se perder, crie outro.')).toBeInTheDocument();
    expect(screen.getByText('Acompanhando · 2 de 5')).toBeInTheDocument();
    expect(screen.getByText('Carlos (pai)')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Marta (tia)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revogar convite' })).toBeInTheDocument();
  });
});
