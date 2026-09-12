/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchCard } from '../MatchCard';

describe('MatchCard Characterization', () => {
  const matchMock = {
    id: 'match-101',
    state: 'SCHEDULED',
    format: 'BEST_OF_3',
    player1: { name: 'Carlos Alcaraz' },
    player2: { name: 'Jannik Sinner' },
  };

  it('renders match card with player names', () => {
    render(<MatchCard match={matchMock} />);

    expect(screen.getByTestId('match-card-match-101')).toBeInTheDocument();
    expect(screen.getByText('Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.getByText('Jannik Sinner')).toBeInTheDocument();
  });

  it('triggers onClick callback when clicked', () => {
    const handleClick = jest.fn();
    render(<MatchCard match={matchMock} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('match-card-match-101'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(matchMock);
  });
});
