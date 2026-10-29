/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchCard } from '../MatchCard';

describe('MatchCard - Ação de Compartilhar Transmissão', () => {
  const baseMatch = {
    id: 'match-share-123',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Atleta A' },
    player2: { id: 'p2', name: 'Atleta B' },
    scoreState: {
      sets: [{ player1: 1, player2: 0, isTiebreak: false }],
      setsWon: { player1: 0, player2: 0 },
      server: 'player1',
      currentGame: { player1: 15, player2: 0 },
    },
  };

  it('deve renderizar o botão de compartilhar transmissão e invocar onShare sem propagar clique para o card', () => {
    const handleShare = jest.fn();
    const handleCardClick = jest.fn();

    render(
      <MatchCard
        match={baseMatch}
        onClick={handleCardClick}
        onShare={handleShare}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /compartilhar transmissão/i });
    expect(shareBtn).toBeInTheDocument();

    fireEvent.click(shareBtn);
    expect(handleShare).toHaveBeenCalledTimes(1);
    expect(handleShare).toHaveBeenCalledWith(baseMatch);
    expect(handleCardClick).not.toHaveBeenCalled();
  });

  it('não deve renderizar o botão quando onShare não é fornecido', () => {
    render(<MatchCard match={baseMatch} />);
    expect(screen.queryByRole('button', { name: /compartilhar transmissão/i })).not.toBeInTheDocument();
  });
});

