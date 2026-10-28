/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchCard } from '../MatchCard';

describe('MatchCard — indicação visual de sacador', () => {
  const baseMatch = {
    id: 'm-live-1',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Novak Djokovic' },
    scheduledAt: null,
    scoreState: {
      sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
    },
    suspendedSessionId: undefined,
    matchStateSnapshot: null,
  };

  it('exibe o ícone 🎾 ao lado do sacador (player1) em partida em andamento', () => {
    render(<MatchCard match={baseMatch} />);

    const serverIndicatorP1 = screen.getByText('🎾');
    expect(serverIndicatorP1).toBeInTheDocument();
    expect(serverIndicatorP1).toHaveAttribute('title', 'Sacador');
    expect(serverIndicatorP1).toHaveAttribute('aria-label', 'Sacador');

    // Player 2 não deve ter indicador de sacador
    const allTennisBalls = screen.getAllByText('🎾');
    expect(allTennisBalls.length).toBe(1);
  });

  it('exibe o ícone 🎾 ao lado do sacador (player2) quando o sacador é player2', () => {
    const matchP2Server = {
      ...baseMatch,
      scoreState: {
        ...baseMatch.scoreState,
        server: 'player2' as const,
      },
    };
    render(<MatchCard match={matchP2Server} />);

    const allTennisBalls = screen.getAllByText('🎾');
    expect(allTennisBalls.length).toBe(1);
  });

  it('exibe o ícone 🎾 quando a partida está suspensa/abandonada com sacador definido', () => {
    const suspendedMatch = {
      ...baseMatch,
      suspendedSessionId: 'sess-1',
    };
    render(<MatchCard match={suspendedMatch} />);

    expect(screen.getAllByText('🎾').length).toBe(1);
  });

  it('NÃO exibe o ícone 🎾 quando a partida está FINALIZADA', () => {
    const finishedMatch = {
      ...baseMatch,
      state: 'FINISHED',
    };
    render(<MatchCard match={finishedMatch} />);

    expect(screen.queryByText('🎾')).toBeNull();
  });

  it('NÃO exibe o ícone 🎾 quando a partida está AGENDADA (SCHEDULED)', () => {
    const scheduledMatch = {
      ...baseMatch,
      state: 'SCHEDULED',
    };
    render(<MatchCard match={scheduledMatch} />);

    expect(screen.queryByText('🎾')).toBeNull();
  });
});

