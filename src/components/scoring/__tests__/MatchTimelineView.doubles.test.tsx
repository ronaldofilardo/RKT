/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchTimelineView } from '../MatchTimelineView';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails: {
      winnerId: 'p1',
      type: 'WINNER',
      isFirstServe: true,
      isSecondServe: false,
      isLet: false,
      serverId: 'p1',
      timestamp: Date.now(),
      rallyDetails: null,
      rallyLength: 1,
      firstFaultDetail: null,
    },
    ...overrides,
  } as TimelinePoint;
}

describe('MatchTimelineView (Doubles)', () => {
  const doublesConfig = {
    player1PartnerName: 'Carlos Alcaraz',
    player2PartnerName: 'Novak Djokovic',
    player1Id: 'p1',
    player1PartnerId: 'p1p',
    player2Id: 'p2',
    player2PartnerId: 'p2p',
  };

  it('exibe as iniciais do sacador individual e da dupla vencedora', () => {
    const points = [
      makePoint({
        pointNumber: 1,
        server: 'player1',
        serverId: 'p1p', // Carlos Alcaraz sacando
        winner: 'PLAYER_1',
      }),
      makePoint({
        pointNumber: 2,
        server: 'player2',
        serverId: 'p2p', // Novak Djokovic sacando
        winner: 'PLAYER_2',
      }),
    ];

    render(
      <MatchTimelineView
        points={points}
        player1Name="Rafael Nadal"
        player2Name="Roger Federer"
        matchId="match-1"
        doubles={doublesConfig}
      />
    );

    // Carlos Alcaraz: C.A.
    expect(screen.getByText('C.A.')).toBeInTheDocument();
    // Novak Djokovic: N.D.
    expect(screen.getByText('N.D.')).toBeInTheDocument();

    // Vencedores: RN/CA e RF/ND
    expect(screen.getByText('RN/CA')).toBeInTheDocument();
    expect(screen.getByText('RF/ND')).toBeInTheDocument();
  });

  it('exibe nomes dos parceiros na legenda de duplas', () => {
    const points = [makePoint({ pointNumber: 1 })];

    render(
      <MatchTimelineView
        points={points}
        player1Name="Rafael Nadal"
        player2Name="Roger Federer"
        matchId="match-1"
        doubles={doublesConfig}
      />
    );

    expect(screen.getByText(/Rafael Nadal\/Carlos Alcaraz/)).toBeInTheDocument();
    expect(screen.getByText(/Roger Federer\/Novak Djokovic/)).toBeInTheDocument();
  });
});
