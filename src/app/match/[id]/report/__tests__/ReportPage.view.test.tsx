/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportPageView } from '../ReportPage.view';
import type { ReportData } from '../report.types';

// Mock the MatchTimelineView to avoid full rendering complexity of the actual timeline component
jest.mock('@/components/scoring/MatchTimelineView', () => ({
  MatchTimelineView: ({ player1Name, player2Name, points }: any) => (
    <div data-testid="match-timeline-view">
      Timeline View Mock - {player1Name} vs {player2Name} ({points.length} points)
    </div>
  ),
}));

describe('ReportPageView - Timeline Functionality', () => {
  const defaultReport: ReportData = {
    state: 'FINISHED',
    startedAt: '2023-01-01T10:00:00Z',
    finishedAt: '2023-01-01T12:00:00Z',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    format: 'BEST_OF_3_SETS',
    tournamentName: 'Test Open',
    round: 'Final',
    category: 'Pro',
    courtType: 'HARD',
    temperature: 25,
    humidity: 50,
    finishNote: null,
    advancedStats: null,
    summary: {
      player1: { aces: 0, winners: 0, forcedErrors: 0, unforcedErrors: 0, doubleFaults: 0, breakPoints: 0, breakPointsWon: 0, pointsWon: 0 },
      player2: { aces: 0, winners: 0, forcedErrors: 0, unforcedErrors: 0, doubleFaults: 0, breakPoints: 0, breakPointsWon: 0, pointsWon: 0 },
      sets: []
    },
    integrity: { status: 'OK', warnings: [] },
    timelinePoints: [],
    comments: []
  };

  const defaultProps = {
    matchId: 'match-1',
    p1Points: 0,
    p2Points: 0,
    totalPoints: 0,
    onContinue: jest.fn(),
    onDashboard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty timeline state when there are no points', () => {
    render(<ReportPageView report={defaultReport} {...defaultProps} />);
    
    // Switch to Timeline tab
    fireEvent.click(screen.getByRole('button', { name: /Timeline/i }));

    expect(screen.getByText('Nenhum ponto registrado nesta partida.')).toBeInTheDocument();
    // Because state is FINISHED, "Iniciar anotação" should NOT be present
    expect(screen.queryByText('Iniciar anotação')).not.toBeInTheDocument();
  });

  it('renders empty timeline state with "Iniciar anotação" button if match is not finished', () => {
    const report: ReportData = { ...defaultReport, state: 'IN_PROGRESS' };
    render(<ReportPageView report={report} {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Timeline/i }));

    const btn = screen.getByText('Iniciar anotação');
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders MatchTimelineView when there are timeline points', () => {
    const report: ReportData = {
      ...defaultReport,
      timelinePoints: [
        { id: 'pt-1', setNumber: 1, gamesScore: { player1: 0, player2: 0 }, gameScore: { player1: 15, player2: 0 }, pointWinner: 'PLAYER_1' } as any
      ]
    };

    render(<ReportPageView report={report} {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Timeline/i }));

    expect(screen.getByTestId('match-timeline-view')).toBeInTheDocument();
    expect(screen.getByText('Timeline View Mock - Player 1 vs Player 2 (1 points)')).toBeInTheDocument();
  });
});
