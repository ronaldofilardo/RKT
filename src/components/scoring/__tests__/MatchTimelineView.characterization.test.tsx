/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchTimelineView } from '../MatchTimelineView';

describe('MatchTimelineView Characterization', () => {
  const defaultProps = {
    points: [],
    player1Name: 'Carlos Alcaraz',
    player2Name: 'Novak Djokovic',
    matchId: 'match-1',
  };

  it('exibe mensagem quando não há pontos registrados', () => {
    render(<MatchTimelineView {...defaultProps} points={[]} />);

    expect(
      screen.getByText('Esta sessão não possui pontos detalhados registrados.')
    ).toBeInTheDocument();
  });

  it('renderiza resumo de contagem de pontos quando há pontos', () => {
    const pointsMock = [
      {
        id: 'p1',
        pointNumber: 1,
        setNumber: 1,
        gameNumber: 1,
        winner: 'PLAYER_1' as const,
        server: 'PLAYER_1' as const,
        type: 'WINNER' as const,
        scoreState: { games: [0, 0], points: '15-0' },
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 1, player2: 0 },
      },
    ];

    render(<MatchTimelineView {...defaultProps} points={pointsMock as any} />);

    expect(screen.getByText('1 pontos')).toBeInTheDocument();
    expect(screen.getByText('Como ler esta tabela')).toBeInTheDocument();
  });
});
