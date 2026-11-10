/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IndicarAnotadorModal } from '../indicar-anotador-modal';

describe('IndicarAnotadorModal', () => {
  const match = {
    id: 'm1',
    format: 'BEST_OF_3',
    state: 'SCHEDULED',
    createdAt: '2026-11-10T10:00:00Z',
    startedAt: null,
    finishedAt: null,
    createdByUserId: 'u1',
    player1: { id: 'p1', name: 'Carlos' },
    player2: { id: 'p2', name: 'Rafael' },
    createdByUser: { id: 'u1', name: 'Gestor', email: 'g@x.com' },
  };

  const coaches = [
    {
      id: 'c1',
      user: {
        id: 'coach-1',
        name: 'Treinador Silva',
        email: 'silva@x.com',
        cpf: '123',
        createdAt: '2026-01-01',
        mustChangePassword: false,
      },
      canInsertAthletes: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não renderiza se open for false', () => {
    const { container } = render(
      <IndicarAnotadorModal open={false} onOpenChange={jest.fn()} match={match} coaches={coaches} onSuccess={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o confronto e lista de treinadores quando aberto', () => {
    render(
      <IndicarAnotadorModal open={true} onOpenChange={jest.fn()} match={match} coaches={coaches} onSuccess={jest.fn()} />
    );

    expect(screen.getByText('Indicar Anotador do Clube')).toBeInTheDocument();
    expect(screen.getByText('Carlos × Rafael')).toBeInTheDocument();
    expect(screen.getByText('Treinador Silva (silva@x.com)')).toBeInTheDocument();
  });

  it('envia requisição de designação ao confirmar', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matchId: 'm1', assignedCoachId: 'coach-1' }),
    }) as any;

    const onSuccess = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <IndicarAnotadorModal open={true} onOpenChange={onOpenChange} match={match} coaches={coaches} onSuccess={onSuccess} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Indicação' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/gestor/matches/m1/assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coachUserId: 'coach-1' }),
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

