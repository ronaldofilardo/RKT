/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchCard } from '../MatchCard';

describe('MatchCard - Botões de Ação no Header (Editar Placar, Retomar Partida, Análise do Set)', () => {
  const baseMatch = {
    id: 'match-test-123',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Carlos Alcaraz' },
    player2: { id: 'p2', name: 'Jannik Sinner' },
    scoreState: {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 3, player2: 2, isTiebreak: false },
      ],
      setsWon: { player1: 1, player2: 0 },
      server: 'player1',
      currentGame: { player1: 30, player2: 15 },
    },
  };

  it('deve renderizar os botões Editar Placar, Retomar Partida e Análise do Set para partida IN_PROGRESS', () => {
    const handleEditScore = jest.fn();
    const handleResumeMatch = jest.fn();
    const handleSetSummary = jest.fn();
    const handleCardClick = jest.fn();

    render(
      <MatchCard
        match={baseMatch}
        onClick={handleCardClick}
        onEditScore={handleEditScore}
        onResumeMatch={handleResumeMatch}
        onSetSummary={handleSetSummary}
      />
    );

    const editBtn = screen.getByTestId('match-card-edit-score-match-test-123');
    const resumeBtn = screen.getByTestId('match-card-resume-match-test-123');
    const setSummaryBtn = screen.getByTestId('match-card-set-summary-match-test-123');

    expect(editBtn).toBeInTheDocument();
    expect(resumeBtn).toBeInTheDocument();
    expect(setSummaryBtn).toBeInTheDocument();

    // Clicar em Editar Placar
    fireEvent.click(editBtn);
    expect(handleEditScore).toHaveBeenCalledWith(baseMatch);
    expect(handleCardClick).not.toHaveBeenCalled();

    // Clicar em Retomar Partida
    fireEvent.click(resumeBtn);
    expect(handleResumeMatch).toHaveBeenCalledWith(baseMatch);
    expect(handleCardClick).not.toHaveBeenCalled();

    // Clicar em Análise do Set
    fireEvent.click(setSummaryBtn);
    expect(handleSetSummary).toHaveBeenCalledWith(baseMatch);
    expect(handleCardClick).not.toHaveBeenCalled();
  });

  it('não deve exibir os botões de ação em partidas FINISHED', () => {
    const finishedMatch = {
      ...baseMatch,
      id: 'match-finished-456',
      state: 'FINISHED',
    };

    render(
      <MatchCard
        match={finishedMatch}
        onEditScore={jest.fn()}
        onResumeMatch={jest.fn()}
        onSetSummary={jest.fn()}
      />
    );

    expect(screen.queryByTestId('match-card-edit-score-match-finished-456')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-card-resume-match-finished-456')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-card-set-summary-match-finished-456')).not.toBeInTheDocument();
  });
});
