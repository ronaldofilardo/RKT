/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchCard, type DashboardMatchPayload } from '../MatchCard';

describe('MatchCard (Doubles)', () => {
  const baseDoublesMatch: DashboardMatchPayload = {
    id: 'doubles-match-1',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    matchType: 'DOUBLES',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Roger Federer' },
    player1Partner: { id: 'p1p', name: 'Carlos Alcaraz' },
    player2Partner: { id: 'p2p', name: 'Novak Djokovic' },
  };

  it('renderiza os nomes compostos das duplas no placar', () => {
    render(<MatchCard match={baseDoublesMatch} />);

    expect(screen.getByText('Rafael Nadal / Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.getByText('Roger Federer / Novak Djokovic')).toBeInTheDocument();
  });

  it('exibe indicador de Duplas no formato da partida', () => {
    render(<MatchCard match={baseDoublesMatch} />);

    expect(screen.getByText(/Duplas/)).toBeInTheDocument();
  });

  it('renderiza nomes normais quando for simples (SINGLES)', () => {
    const singlesMatch: DashboardMatchPayload = {
      ...baseDoublesMatch,
      matchType: 'SINGLES',
      player1Partner: null,
      player2Partner: null,
    };

    render(<MatchCard match={singlesMatch} />);

    expect(screen.getByText('Rafael Nadal')).toBeInTheDocument();
    expect(screen.getByText('Roger Federer')).toBeInTheDocument();
  });
});
