/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditMatchInfoModal } from '../EditMatchInfoModal';
import type { DashboardMatchPayload } from '../MatchCard';

// Mock do Toast
const mockToast = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('EditMatchInfoModal', () => {
  const baseMatch: DashboardMatchPayload = {
    id: 'match-123',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    courtType: 'CLAY',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Novak Djokovic' },
    tournamentName: 'Roland Garros',
    clubName: 'Club de Tennis Paris',
    category: 'Profissional',
    round: 'Final',
    bracketType: 'MAIN',
    temperature: 28,
    humidity: 50,
    visibility: 'PUBLIC',
    details: 'Bolas novas e vento leve',
    scheduledAt: '2026-10-15T15:30:00.000Z',
    version: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('deve carregar os campos preenchidos com os dados da partida', () => {
    render(
      <EditMatchInfoModal
        match={baseMatch}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue('Roland Garros')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Club de Tennis Paris')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Final')).toBeInTheDocument();
    expect(screen.getByDisplayValue('28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bolas novas e vento leve')).toBeInTheDocument();

    // Campos removidos não devem estar no documento
    expect(screen.queryByLabelText(/Categoria/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Chave/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Tipo de Quadra/i)).not.toBeInTheDocument();
  });

  it('deve enviar requisição PATCH com dados atualizados e acionar onSuccess', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'match-123' }),
    });

    const completeAction = jest.fn();
    const dismissOverlay = jest.fn();

    render(
      <EditMatchInfoModal
        match={baseMatch}
        onClose={dismissOverlay}
        onSuccess={completeAction}
      />
    );

    // Altera o torneio, clube e os detalhes
    const tournamentInput = screen.getByDisplayValue('Roland Garros');
    fireEvent.change(tournamentInput, { target: { value: 'Wimbledon' } });

    const clubInput = screen.getByDisplayValue('Club de Tennis Paris');
    fireEvent.change(clubInput, { target: { value: 'All England Club' } });

    const detailsInput = screen.getByDisplayValue('Bolas novas e vento leve');
    fireEvent.change(detailsInput, { target: { value: 'Quadra de grama impecável' } });

    // Clica em Salvar
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/matches/match-123');
    expect(options.method).toBe('PATCH');

    const body = JSON.parse(options.body);
    expect(body.tournamentName).toBe('Wimbledon');
    expect(body.clubName).toBe('All England Club');
    expect(body.details).toBe('Quadra de grama impecável');
    expect(body.version).toBe(3);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    );
    expect(completeAction).toHaveBeenCalledTimes(1);
    expect(dismissOverlay).toHaveBeenCalledTimes(1);
  });

  it('deve fechar o modal ao clicar em Cancelar', () => {
    const dismissOverlay = jest.fn();
    render(
      <EditMatchInfoModal
        match={baseMatch}
        onClose={dismissOverlay}
        onSuccess={jest.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(dismissOverlay).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o campo Rodada como um droplist (select) com as opções de rodada', () => {
    render(
      <EditMatchInfoModal
        match={baseMatch}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const roundSelect = screen.getByRole('combobox', { name: /Rodada/i });
    expect(roundSelect).toBeInTheDocument();
    expect(roundSelect.tagName.toLowerCase()).toBe('select');

    // Opções de rodada devem estar presentes
    expect(screen.getByRole('option', { name: 'Selecione a rodada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Round Robin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1a Rodada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Oitavas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Quartas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Semifinal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Final' })).toBeInTheDocument();

    // Deve permitir alterar a seleção no droplist
    fireEvent.change(roundSelect, { target: { value: 'semifinal' } });
    expect((roundSelect as HTMLSelectElement).value).toBe('semifinal');
  });
});

