/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PerformanceRadarSection } from '../advanced-stats-radar';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import type { TimelinePoint } from '@/core/scoring/types';

function createMockPoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    server: 'player1',
    receiver: 'player2',
    serverScore: '0',
    receiverScore: '0',
    setNumber: 1,
    gameNumber: 1,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    winner: 'PLAYER_1',
    isBreakPoint: false,
    isGamePoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    isTiebreak: false,
    type: 'WINNER',
    firstServeIn: true,
    isSecondServe: false,
    secondServeIn: false,
    rallyLength: 3,
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('PerformanceRadarSection', () => {
  const points: TimelinePoint[] = [
    createMockPoint({ pointNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE', firstServeIn: true }),
    createMockPoint({ pointNumber: 2, server: 'player1', winner: 'PLAYER_2', type: 'DOUBLE_FAULT', firstServeIn: false, isSecondServe: true }),
    createMockPoint({ pointNumber: 3, server: 'player2', winner: 'PLAYER_1', type: 'WINNER', firstServeIn: true }),
  ];

  const stats = computeAdvancedStats(points);

  it('renderiza título do radar e nomes dos jogadores', () => {
    render(<PerformanceRadarSection stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    expect(screen.getByText('Radar de Desempenho')).toBeInTheDocument();
    expect(screen.getAllByText('Carlos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Rafael').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza o SVG do radar com seus eixos', () => {
    render(<PerformanceRadarSection stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    const svg = screen.getByRole('img', { name: /Radar de desempenho/i });
    expect(svg).toBeInTheDocument();
    expect(screen.getAllByText('1º Saque').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Efic. Saque').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Winners').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Precisão').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Devolução').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Def. Break').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza as barras de score comparativas', () => {
    render(<PerformanceRadarSection stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    expect(screen.getByText('Pontos Totais')).toBeInTheDocument();
  });
});

