/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetSummaryModal } from '../SetSummaryModal';
import { GameErrorsHistogram } from '../GameErrorsHistogram';
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
    pointDetails: {
      server: 'player1',
      receiver: 'player2',
      winner: 'player1',
      isFirstServe: true,
      isSecondServe: false,
      isAce: false,
      isDoubleFault: false,
      isWinner: true,
      isForcedError: false,
      isUnforcedError: false,
      scoreBefore: {
        player1: '0',
        player2: '0',
        gameScore: { player1: 0, player2: 0 },
        setScore: { player1: 0, player2: 0 },
        sets: [],
        server: 'player1',
        isTiebreak: false,
      },
      scoreAfter: {
        player1: '15',
        player2: '0',
        gameScore: { player1: 1, player2: 0 },
        setScore: { player1: 0, player2: 0 },
        sets: [],
        server: 'player1',
        isTiebreak: false,
      },
    },
    ...overrides,
  };
}

describe('GameErrorsHistogram', () => {
  it('renderiza histograma vazio quando não há games com erro', () => {
    render(
      <GameErrorsHistogram
        gameErrors={[]}
        player1Name="Carlos Alcaraz"
        player2Name="Novak Djokovic"
      />
    );
    expect(screen.getByText('Nenhum registro de erros disponível neste set.')).toBeInTheDocument();
  });

  it('renderiza os blocos dos games no SVG', () => {
    const gameErrors = [
      {
        gameIndex: 1,
        server: 'player1' as const,
        scoreLabel: '1-0',
        isTiebreak: false,
        winner: 'player1' as const,
        p1Errors: { unforced: 0, forced: 1, total: 1 },
        p2Errors: { unforced: 2, forced: 0, total: 2 },
      },
    ];

    render(
      <GameErrorsHistogram
        gameErrors={gameErrors}
        player1Name="Carlos Alcaraz"
        player2Name="Novak Djokovic"
      />
    );

    expect(screen.getByText('G1')).toBeInTheDocument();
    expect(screen.getByText('1-0')).toBeInTheDocument();
  });
});

describe('SetSummaryModal', () => {
  const points: TimelinePoint[] = [
    createMockPoint({ pointNumber: 1, server: 'player1', type: 'ACE', winner: 'PLAYER_1' }),
    createMockPoint({ pointNumber: 2, server: 'player1', type: 'DOUBLE_FAULT', winner: 'PLAYER_2' }),
  ];

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(
      <SetSummaryModal
        isOpen={false}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Carlos"
        player2Name="Rafael"
        completedSetsCount={1}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza modal com título e métricas quando aberto', () => {
    render(
      <SetSummaryModal
        isOpen={true}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Carlos"
        player2Name="Rafael"
        initialSetNumber={1}
        completedSetsCount={1}
      />
    );

    expect(screen.getByText('Resumo do 1º Set')).toBeInTheDocument();
    expect(screen.getByText('Saque & Eficiência')).toBeInTheDocument();
    expect(screen.getByText('Break Points')).toBeInTheDocument();
    expect(screen.getByText('Prosseguir para o Set 2 →')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão de prosseguir ou no botão fechar', () => {
    const handleClose = jest.fn();

    render(
      <SetSummaryModal
        isOpen={true}
        onClose={handleClose}
        timelinePoints={points}
        player1Name="Carlos"
        player2Name="Rafael"
        initialSetNumber={1}
        completedSetsCount={1}
      />
    );

    fireEvent.click(screen.getByText('Prosseguir para o Set 2 →'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Fechar resumo'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('renderiza abas para múltiplos sets concluídos e permite alternar', () => {
    render(
      <SetSummaryModal
        isOpen={true}
        onClose={jest.fn()}
        timelinePoints={points}
        player1Name="Carlos"
        player2Name="Rafael"
        initialSetNumber={1}
        completedSetsCount={2}
      />
    );

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Set 2'));
    expect(screen.getByText('Resumo do 2º Set')).toBeInTheDocument();
  });
});
