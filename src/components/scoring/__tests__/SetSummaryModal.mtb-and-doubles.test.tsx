/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetSummaryModal } from '../SetSummaryModal';
import type { TimelinePoint } from '@/core/scoring/types';

function createMockPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 15, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: null,
    ...overrides,
  };
}

describe('SetSummaryModal — Match Tie-Break & Duplas', () => {
  const points: TimelinePoint[] = [
    createMockPoint({ pointNumber: 1, server: 'player1', type: 'ACE', winner: 'PLAYER_1' }),
  ];

  it('1. Formato MATCH_TB_10 exibe placar do MTB (ex: 10 × 3), título adequado e oculta Break Points', () => {
    const completedSetsData = [
      {
        games: { player1: 0, player2: 0 },
        winner: 'player1' as const,
        isCompleted: true,
        tiebreakScore: { player1: 10, player2: 3 },
      },
    ];

    render(
      <SetSummaryModal
        isOpen={true}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Carlos / Parceiro A"
        player2Name="Rafael / Parceiro B"
        initialSetNumber={1}
        completedSetsCount={1}
        completedSetsData={completedSetsData}
        format="MATCH_TB_10"
      />
    );

    // Título e Badge
    expect(screen.getByText('Match Tie-Break')).toBeInTheDocument();
    expect(screen.getByText('Resumo do Match Tie-Break')).toBeInTheDocument();

    // Placar direto do MTB (10 × 3) e NÃO games (0 x 0)
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('(3)')).not.toBeInTheDocument(); // Não exibe parênteses de TB secundário

    // Break Points não se aplicam a Match Tie-Break
    expect(screen.queryByText('Break Points')).not.toBeInTheDocument();

    // Não deve haver botão "Prosseguir para o Set 2 →"
    expect(screen.queryByText(/Prosseguir para o Set 2/)).not.toBeInTheDocument();
  });

  it('2. Formato BEST_OF_3_MATCH_TB no 3º set exibe aba MTB e placar do tiebreak', () => {
    const completedSetsData = [
      { games: { player1: 6, player2: 4 }, winner: 'player1' as const, isCompleted: true },
      { games: { player1: 4, player2: 6 }, winner: 'player2' as const, isCompleted: true },
      { games: { player1: 0, player2: 0 }, winner: 'player2' as const, isCompleted: true, tiebreakScore: { player1: 8, player2: 10 } },
    ];

    render(
      <SetSummaryModal
        isOpen={true}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Alcaraz"
        player2Name="Djokovic"
        initialSetNumber={3}
        completedSetsCount={3}
        completedSetsData={completedSetsData}
        format="BEST_OF_3_MATCH_TB"
      />
    );

    // Abas de sets: Set 1, Set 2 e MTB
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    expect(screen.getByText('MTB')).toBeInTheDocument();

    // Título do set 3
    expect(screen.getByText('Resumo do Match Tie-Break')).toBeInTheDocument();

    // Placar direto do MTB (8 × 10)
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('(8)')).not.toBeInTheDocument();

    // Break Points ocultos no 3º set
    expect(screen.queryByText('Break Points')).not.toBeInTheDocument();
  });

  it('3. Formato BEST_OF_3 tradicional em set normal preserva games e Break Points', () => {
    const completedSetsData = [
      { games: { player1: 6, player2: 3 }, winner: 'player1' as const, isCompleted: true },
    ];

    render(
      <SetSummaryModal
        isOpen={true}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Carlos"
        player2Name="Rafael"
        initialSetNumber={1}
        completedSetsCount={1}
        completedSetsData={completedSetsData}
        format="BEST_OF_3"
      />
    );

    expect(screen.getByText('Análise do Set')).toBeInTheDocument();
    expect(screen.getByText('Resumo do 1º Set')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Break Points')).toBeInTheDocument();
    expect(screen.getByText('Prosseguir para o Set 2 →')).toBeInTheDocument();
  });
});
