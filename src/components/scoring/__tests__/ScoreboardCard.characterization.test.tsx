/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreboardCard } from '../ScoreboardCard';

describe('ScoreboardCard Characterization', () => {
  const defaultProps = {
    player1: { id: 'p1', name: 'Carlos Alcaraz' },
    player2: { id: 'p2', name: 'Jannik Sinner' },
    scoreState: {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 3, player2: 2, isTiebreak: false },
      ],
      setsWon: { player1: 1, player2: 0 },
      currentGame: { player1: 0, player2: 0 },
    },
    format: 'BEST_OF_3',
  };

  it('renderiza os nomes dos jogadores e os sets do placar', () => {
    render(<ScoreboardCard {...defaultProps} />);

    expect(screen.getByText('Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.getByText('Jannik Sinner')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
