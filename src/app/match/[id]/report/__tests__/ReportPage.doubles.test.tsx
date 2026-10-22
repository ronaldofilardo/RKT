/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportPageView } from '../ReportPage.view';
import type { ReportData } from '../report.types';

jest.mock('@/components/scoring/MatchTimelineView', () => ({
  MatchTimelineView: ({ player1Name, player2Name, doubles }: any) => (
    <div data-testid="match-timeline-view">
      Timeline: {player1Name} vs {player2Name} - Doubles: {doubles ? 'YES' : 'NO'}
    </div>
  ),
}));

describe('ReportPageView (Doubles)', () => {
  const doublesReport: ReportData = {
    state: 'FINISHED',
    matchType: 'DOUBLES',
    startedAt: '2026-10-21T10:00:00Z',
    finishedAt: '2026-10-21T12:00:00Z',
    player1: { id: 'p1', name: 'Rafael Nadal' },
    player2: { id: 'p2', name: 'Roger Federer' },
    player1Partner: { id: 'p1p', name: 'Carlos Alcaraz' },
    player2Partner: { id: 'p2p', name: 'Novak Djokovic' },
    format: 'BEST_OF_3_SETS',
    tournamentName: 'Roland Garros',
    round: 'Final',
    category: 'Duplas Pro',
    courtType: 'CLAY',
    temperature: 24,
    humidity: 55,
    finishNote: null,
    advancedStats: null,
    summary: {
      player1: { aces: 5, winners: 12, forcedErrors: 3, unforcedErrors: 6, doubleFaults: 1, breakPoints: 4, breakPointsWon: 2, pointsWon: 45 },
      player2: { aces: 8, winners: 15, forcedErrors: 5, unforcedErrors: 8, doubleFaults: 2, breakPoints: 3, breakPointsWon: 1, pointsWon: 40 },
      sets: [{ player1: 6, player2: 4, isTiebreak: false }]
    },
    integrity: { status: 'OK', warnings: [] },
    timelinePoints: [
      {
        pointNumber: 1,
        winner: 'PLAYER_1',
        type: 'ACE',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        gameScore: { player1: 15, player2: 0 },
        gamesScore: { player1: 0, player2: 0 },
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyLength: 1,
        rallyDetails: null,
        pointDetails: {
          winnerId: 'p1',
          type: 'ACE',
          isFirstServe: true,
          isSecondServe: false,
          isLet: false,
          serverId: 'p1',
          timestamp: Date.now(),
          rallyDetails: null,
          rallyLength: 1,
          firstFaultDetail: null,
        },
      } as any,
    ],
    comments: [],
  };

  const defaultProps = {
    matchId: 'match-doubles-1',
    p1Points: 45,
    p2Points: 40,
    totalPoints: 85,
    onContinue: jest.fn(),
    onDashboard: jest.fn(),
  };

  it('exibe nomes compostos e indicador Duplas no cabeçalho e estatísticas', () => {
    render(<ReportPageView report={doublesReport} {...defaultProps} />);

    // Cabeçalho e StatCards
    expect(screen.getAllByText(/Rafael Nadal \/ Carlos Alcaraz/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Roger Federer \/ Novak Djokovic/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Duplas · BEST/i)).toBeInTheDocument();

    // Stat cards
    expect(screen.getAllByText('Rafael Nadal / Carlos Alcaraz').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Roger Federer / Novak Djokovic').length).toBeGreaterThanOrEqual(1);
  });
});
