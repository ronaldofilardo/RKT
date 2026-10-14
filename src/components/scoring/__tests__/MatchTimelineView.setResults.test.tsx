/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import {
  MatchTimelineView,
  getSetResults,
  computeSetResultsFromPoints,
  extractSetsFromScoreState,
} from '../MatchTimelineView';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_2',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 1, player2: 3 }, // 15-40
    gamesScore: { player1: 3, player2: 5 },
    setNumber: 1,
    isBreakPoint: true,
    isGameBall: true,
    isSetBall: true,
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
    ...overrides,
  } as TimelinePoint;
}

describe('MatchTimelineView — Resultado ao final da tabela', () => {
  const defaultProps = {
    player1Name: 'Ronaldo',
    player2Name: 'Amanda Fahd',
    matchId: 'match-123',
    showFinalResult: true,
  };

  it('calcula corretamente o resultado final 3x6 e 3x6 a partir dos pontos (sem scoreState)', () => {
    // Set 1: termina no ponto 51 com gamesScore 3x5 e winner PLAYER_2
    // Set 2: termina no ponto 102 com gamesScore 3x5 e winner PLAYER_2
    const points: TimelinePoint[] = [
      makePoint({ pointNumber: 1, setNumber: 1, gamesScore: { player1: 0, player2: 0 } }),
      makePoint({
        pointNumber: 51,
        setNumber: 1,
        gamesScore: { player1: 3, player2: 5 },
        gameScore: { player1: 1, player2: 3 }, // 15-40
        winner: 'PLAYER_2',
        isSetBall: true,
      }),
      makePoint({ pointNumber: 52, setNumber: 2, gamesScore: { player1: 0, player2: 0 } }),
      makePoint({
        pointNumber: 102,
        setNumber: 2,
        gamesScore: { player1: 3, player2: 5 },
        gameScore: { player1: 1, player2: 3 }, // 15-40
        winner: 'PLAYER_2',
        isSetBall: true,
      }),
    ];

    const results = computeSetResultsFromPoints(points);

    expect(results).toEqual([
      { setNumber: 1, p1: 3, p2: 6 },
      { setNumber: 2, p1: 3, p2: 6 },
    ]);
  });

  it('extrai sets de scoreState plano e envelopado', () => {
    const flatState = {
      sets: [
        { player1: 3, player2: 6, isTiebreak: false },
        { player1: 3, player2: 6, isTiebreak: false },
      ],
    };
    expect(extractSetsFromScoreState(flatState)).toEqual([
      { setNumber: 1, p1: 3, p2: 6, tiebreak: undefined },
      { setNumber: 2, p1: 3, p2: 6, tiebreak: undefined },
    ]);

    const envelopeState = {
      state: flatState,
      history: [],
    };
    expect(extractSetsFromScoreState(envelopeState)).toEqual([
      { setNumber: 1, p1: 3, p2: 6, tiebreak: undefined },
      { setNumber: 2, p1: 3, p2: 6, tiebreak: undefined },
    ]);

    expect(extractSetsFromScoreState(JSON.stringify(flatState))).toEqual([
      { setNumber: 1, p1: 3, p2: 6, tiebreak: undefined },
      { setNumber: 2, p1: 3, p2: 6, tiebreak: undefined },
    ]);
  });

  it('lida com set decidido por tiebreak regular (ex: 7x6 com tiebreak 7x5)', () => {
    const points: TimelinePoint[] = [
      makePoint({
        pointNumber: 48,
        setNumber: 1,
        isTiebreak: false,
        gamesScore: { player1: 5, player2: 6 },
        winner: 'PLAYER_1',
      }),
      makePoint({
        pointNumber: 49,
        setNumber: 1,
        isTiebreak: true,
        gameScore: { player1: 0, player2: 0 },
        winner: 'PLAYER_1',
      }),
      makePoint({
        pointNumber: 60,
        setNumber: 1,
        isTiebreak: true,
        gameScore: { player1: 6, player2: 5 },
        winner: 'PLAYER_1',
      }),
    ];

    const results = computeSetResultsFromPoints(points);
    expect(results).toEqual([
      { setNumber: 1, p1: 7, p2: 6, tiebreak: { p1: 7, p2: 5 } },
    ]);
  });

  it('renderiza no DOM a linha de Resultado mostrando 3x6 e 3x6 (nunca 3x5)', () => {
    const points: TimelinePoint[] = [
      makePoint({ pointNumber: 1, setNumber: 1, gamesScore: { player1: 0, player2: 0 } }),
      makePoint({
        pointNumber: 51,
        setNumber: 1,
        gamesScore: { player1: 3, player2: 5 },
        gameScore: { player1: 1, player2: 3 },
        winner: 'PLAYER_2',
        isSetBall: true,
      }),
      makePoint({ pointNumber: 52, setNumber: 2, gamesScore: { player1: 0, player2: 0 } }),
      makePoint({
        pointNumber: 102,
        setNumber: 2,
        gamesScore: { player1: 3, player2: 5 },
        gameScore: { player1: 1, player2: 3 },
        winner: 'PLAYER_2',
        isSetBall: true,
      }),
    ];

    render(<MatchTimelineView {...defaultProps} points={points} />);

    const resultadoHeader = screen.getByText('Resultado');
    expect(resultadoHeader).toBeInTheDocument();

    const resultadoRow = resultadoHeader.closest('tr')!;
    // Devem aparecer os dois sets finalizados em 3x6 dentro da linha de Resultado
    const setScoresInResultado = within(resultadoRow).getAllByText('3x6');
    expect(setScoresInResultado).toHaveLength(2);

    // Não deve conter 3x5 dentro da linha de Resultado
    expect(within(resultadoRow).queryByText('3x5')).not.toBeInTheDocument();
  });
});
