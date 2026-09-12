/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';

describe('PlayerCard Characterization', () => {
  const defaultProps = {
    player: { id: 'p1', name: 'Roger Federer' },
    side: 'player1' as const,
    scoreState: {
      sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
    },
    isServing: true,
    isSetPoint: false,
    isBreakPoint: false,
    isWinner: false,
    onPoint: jest.fn(),
    onSwipeDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o nome do jogador e os pontos do game', () => {
    render(<PlayerCard {...defaultProps} />);

    expect(screen.getByText('Roger Federer')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Toque para marcar ponto')).toBeInTheDocument();
  });

  it('chama onPoint ao clicar no card', () => {
    render(<PlayerCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: /\+ Ponto Roger Federer/i });
    fireEvent.click(card);

    expect(defaultProps.onPoint).toHaveBeenCalledTimes(1);
  });
});
