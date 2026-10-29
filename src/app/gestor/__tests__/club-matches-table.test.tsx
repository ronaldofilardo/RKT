/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClubMatchesTable } from '../club-matches-table';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

jest.mock('@/contexts/FloatingSpectatorContext', () => ({
  useFloatingSpectatorOptional: jest.fn(),
}));

const mockedHook = useFloatingSpectatorOptional as jest.Mock;

const match = (id: string, state: string, format = 'BEST_OF_3', scoreState?: unknown) => ({
  id, state, format, createdAt: '2026-10-29T10:00:00Z',
  startedAt: null, finishedAt: null, createdByUserId: 'u1',
  player1: { id: 'p1', name: 'Ana' }, player2: { id: 'p2', name: 'Bia' },
  createdByUser: { id: 'u1', name: 'Coach', email: 'c@x.com' },
  scoreState,
});

describe('ClubMatchesTable — Ver Partida', () => {
  it('exibe coluna Placar e Formato amigável do droplist de nova partida', () => {
    mockedHook.mockReturnValue(null);
    const score = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 7, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 3 } },
      ],
    };
    render(<ClubMatchesTable matches={[match('m0', 'FINISHED', 'BEST_OF_3_NO_AD', score)]} />);
    expect(screen.getByText('Placar')).toBeInTheDocument();
    expect(screen.getByText('Melhor de 3 sets "no ad"')).toBeInTheDocument();
    expect(screen.getByText('6/4 7/6(3)')).toBeInTheDocument();
  });

  it('em andamento: abre o popup de acompanhamento (sem navegar)', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });
    render(<ClubMatchesTable matches={[match('m1', 'IN_PROGRESS')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m1', 'Ana × Bia');
    expect(screen.queryByRole('link', { name: 'Ver Partida' })).toBeNull();
  });

  it('agendada: também abre o popup', () => {
    const open = jest.fn();
    mockedHook.mockReturnValue({ open });
    render(<ClubMatchesTable matches={[match('m2', 'SCHEDULED')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Partida' }));
    expect(open).toHaveBeenCalledWith('m2', 'Ana × Bia');
  });

  it('finalizada: mantém o link para o relatório', () => {
    mockedHook.mockReturnValue({ open: jest.fn() });
    render(<ClubMatchesTable matches={[match('m3', 'FINISHED')]} />);
    expect(screen.getByRole('link', { name: 'Ver Partida' })).toHaveAttribute('href', '/match/m3/report');
  });

  it('sem provider: em andamento cai no link da tela de acompanhamento', () => {
    mockedHook.mockReturnValue(null);
    render(<ClubMatchesTable matches={[match('m4', 'IN_PROGRESS')]} />);
    expect(screen.getByRole('link', { name: 'Ver Partida' })).toHaveAttribute('href', '/matches/acompanhar/m4');
  });
});
