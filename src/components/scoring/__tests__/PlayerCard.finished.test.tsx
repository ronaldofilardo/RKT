/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    player: { id: 'p1', name: 'Luiza Mandin' },
    side: 'player1' as const,
    scoreState: {
      sets: [
        { player1: 6, player2: 2, isTiebreak: false, tiebreakScore: null },
        { player1: 6, player2: 2, isTiebreak: false, tiebreakScore: null },
      ],
      // game residual (legado: partidas salvas com o último game preso)
      currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null },
      server: 'player1' as const,
      isFinished: true,
      winner: 'player1' as const,
      setsWon: { player1: 2, player2: 0 },
    },
    isServing: false,
    isSetPoint: false,
    isBreakPoint: false,
    isWinner: true,
    onPoint: jest.fn(),
    onSwipeDown: jest.fn(),
    disabled: true,
    ...overrides,
  };
}

describe('PlayerCard — partida finalizada', () => {
  it('não exibe o game residual (40/15) depois do fim da partida', () => {
    render(<PlayerCard {...makeProps()} />);

    expect(screen.queryByText('40')).not.toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('continua exibindo os pontos do game com a partida em andamento', () => {
    const props = makeProps();
    render(
      <PlayerCard
        {...props}
        scoreState={{ ...props.scoreState, isFinished: false, winner: null }}
        disabled={false}
        isWinner={false}
      />,
    );

    expect(screen.getByText('40')).toBeInTheDocument();
  });
});
