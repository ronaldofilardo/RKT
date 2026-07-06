/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '@/components/scoring/PlayerCard';

const basePlayer = { id: 'p1', name: 'Jogador A' };
const baseState = {
  sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
  server: 'player1' as const,
  isFinished: false,
  winner: null,
  setsWon: { player1: 0, player2: 0 },
};

describe('PlayerCard', () => {
  it('deve exibir os pontos do game atual', () => {
    render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={baseState}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />
    );

    expect(screen.getByText('0')).toBeTruthy();
  });

  it('deve exibir ADV quando tiver vantagem', () => {
    const stateWithAdvantage = {
      ...baseState,
      currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: 'player1' as const },
    };
    
    render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={stateWithAdvantage}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />
    );

    expect(screen.getByText('ADV')).toBeTruthy();
  });

  it('não deve duplicar ponto quando houver touch seguido de click sintetizado', () => {
    const onPoint = jest.fn();
    const { container } = render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={baseState}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={onPoint}
        onSwipeDown={jest.fn()}
      />
    );

    const button = container.querySelector('button');
    if (!button) throw new Error('button not found');

    fireEvent.touchStart(button, { touches: [{ clientY: 0 }] });
    fireEvent.touchEnd(button, { changedTouches: [{ clientY: 50 }] });
    fireEvent.click(button);

    expect(onPoint).toHaveBeenCalledTimes(1);
  });
});
