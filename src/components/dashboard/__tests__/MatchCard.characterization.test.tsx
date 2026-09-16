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

  // ─── Regressão: correção do warning jsx-a11y/no-static-element-interactions ─
  // O card raiz tem onClick/onKeyDown mas é um <div> (elemento não-nativo)
  // sem role/tabIndex — o linter aponta isso como inacessível via teclado.
  // Corrigido para expor role="button" + tabIndex=0 quando é clicável, e
  // nenhum dos dois quando não há onClick (card estático).
  it('expõe role="button" e tabIndex=0 quando onClick é passado (regressão a11y)', () => {
    render(<MatchCard match={matchMock} onClick={jest.fn()} />);
    const card = screen.getByTestId('match-card-match-101');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('não expõe role nem tabIndex quando não há onClick (card estático)', () => {
    render(<MatchCard match={matchMock} />);
    const card = screen.getByTestId('match-card-match-101');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('ativa onClick pelo teclado (Enter/Espaço), preservando o comportamento anterior', () => {
    const handleClick = jest.fn();
    render(<MatchCard match={matchMock} onClick={handleClick} />);
    const card = screen.getByTestId('match-card-match-101');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
