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
    const openEditScoreModal = jest.fn();
    const resumeMatchFromDashboard = jest.fn();
    const openSetSummary = jest.fn();
    const onCardSelect = jest.fn();

    render(
      <MatchCard
        match={baseMatch}
        onClick={onCardSelect}
        onEditScore={openEditScoreModal}
        onResumeMatch={resumeMatchFromDashboard}
        onSetSummary={openSetSummary}
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
    expect(openEditScoreModal).toHaveBeenCalledWith(baseMatch);
    expect(onCardSelect).not.toHaveBeenCalled();

    // Clicar em Retomar Partida
    fireEvent.click(resumeBtn);
    expect(resumeMatchFromDashboard).toHaveBeenCalledWith(baseMatch);
    expect(onCardSelect).not.toHaveBeenCalled();

    // Clicar em Análise do Set
    fireEvent.click(setSummaryBtn);
    expect(openSetSummary).toHaveBeenCalledWith(baseMatch);
    expect(onCardSelect).not.toHaveBeenCalled();
  });

  it('deve renderizar o botão Info quando onEditInfo é fornecido e partida não está FINISHED', () => {
    const openInfoEditor = jest.fn();
    const onCardSelect = jest.fn();

    render(
      <MatchCard
        match={baseMatch}
        onClick={onCardSelect}
        onEditInfo={openInfoEditor}
      />
    );

    const infoBtn = screen.getByTestId('match-card-edit-info-match-test-123');
    expect(infoBtn).toBeInTheDocument();

    fireEvent.click(infoBtn);
    expect(openInfoEditor).toHaveBeenCalledWith(baseMatch);
    expect(onCardSelect).not.toHaveBeenCalled();
  });

  it('não deve exibir os botões de ação e Info em partidas FINISHED', () => {
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
        onEditInfo={jest.fn()}
      />
    );

    expect(screen.queryByTestId('match-card-edit-score-match-finished-456')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-card-resume-match-finished-456')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-card-set-summary-match-finished-456')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-card-edit-info-match-finished-456')).not.toBeInTheDocument();
  });

  it('no formato sets curtos 2/2 (SHORT_SET_2V2_NO_AD) deve mostrar 2-2 nos dois sets desde a criação da partida', () => {
    const shortSetMatch = {
      id: 'short-set-match-1',
      state: 'SCHEDULED',
      format: 'SHORT_SET_2V2_NO_AD',
      player1: { id: 'p1', name: 'Atleta A' },
      player2: { id: 'p2', name: 'Atleta B' },
      scoreState: {
        sets: [
          { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 0, player2: 0 },
        server: 'player1',
        currentGame: { player1: 0, player2: 0 },
      },
    };

    const { container } = render(<MatchCard match={shortSetMatch} />);

    // Deve renderizar duas colunas de sets com "2" para cada jogador
    const scoreCells = container.querySelectorAll('.tabular-nums');
    // Filtrando células de texto "2" (devem ter 4 células com "2", 2 para cada jogador)
    const twoCells = Array.from(scoreCells).filter(el => el.textContent === '2');
    expect(twoCells.length).toBe(4);
  });
});
