/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardMatchModals } from '../components/DashboardMatchModals';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

describe('DashboardMatchModals (Doubles Start)', () => {
  const doublesMatch: DashboardMatchPayload = {
    id: 'doubles-match-1',
    state: 'SCHEDULED',
    format: 'BEST_OF_3',
    matchType: 'DOUBLES',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player1Partner: { id: 'p1p', name: 'Carlos Alcaraz' },
    player2: { id: 'p2', name: 'Roger Federer' },
    player2Partner: { id: 'p2p', name: 'Novak Djokovic' },
  };

  const singlesMatch: DashboardMatchPayload = {
    id: 'singles-match-1',
    state: 'SCHEDULED',
    format: 'BEST_OF_3',
    matchType: 'SINGLES',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Roger Federer' },
  };

  const defaultProps = {
    matchToDelete: null,
    onCancelDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    startingMatch: false,
    onSelectServer: jest.fn(),
    onCloseServer: jest.fn(),
    setSummaryMatch: null,
    setSummaryTimelinePoints: [],
    completedSetsCount: 0,
    completedSetsData: [],
    onCloseSetSummary: jest.fn(),
    onResumeSetSummary: jest.fn(),
    editMatch: null,
    onCloseEditInfo: jest.fn(),
    onSuccessEditInfo: jest.fn(),
  };

  it('abre DoublesServerSelectionModal quando serverMatch for de duplas', () => {
    render(
      <DashboardMatchModals
        {...defaultProps}
        serverMatch={doublesMatch}
      />
    );

    // O modal de duplas
    expect(screen.getByText('Formação Inicial de Duplas')).toBeInTheDocument();
    expect(screen.getByText(/Rafael Nadal & Carlos Alcaraz/)).toBeInTheDocument();
    expect(screen.getByText(/Roger Federer & Novak Djokovic/)).toBeInTheDocument();
  });

  it('chama onSelectServer com initialServerId e doublesSetup ao confirmar duplas', () => {
    const onSelectServer = jest.fn();
    render(
      <DashboardMatchModals
        {...defaultProps}
        serverMatch={doublesMatch}
        onSelectServer={onSelectServer}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar e Iniciar Partida/i });
    fireEvent.click(confirmBtn);

    expect(onSelectServer).toHaveBeenCalledTimes(1);
    const [initialServerId, doublesSetup] = onSelectServer.mock.calls[0];
    expect(initialServerId).toBe('p1');
    expect(doublesSetup).toBeDefined();
    expect(doublesSetup.serveOrder.player1).toEqual(['p1', 'p1p']);
    expect(doublesSetup.serveOrder.player2).toEqual(['p2', 'p2p']);
  });

  it('abre ServerSelectionModal tradicional quando serverMatch for de simples', () => {
    render(
      <DashboardMatchModals
        {...defaultProps}
        serverMatch={singlesMatch}
      />
    );

    // O modal de simples tradicional
    expect(screen.getByText('Quem saca primeiro?')).toBeInTheDocument();
    expect(screen.queryByText('Definição de Saque e Devolução (Duplas)')).not.toBeInTheDocument();
  });
});
