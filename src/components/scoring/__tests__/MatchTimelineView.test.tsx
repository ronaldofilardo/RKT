/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
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

describe('MatchTimelineView — chaves únicas por grupo', () => {
  it('não emite warning de chave duplicada quando groupedBySet contém setNumber repetido', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const points = [
      makePoint({ pointNumber: 1, setNumber: 1 }),
      makePoint({ pointNumber: 2, setNumber: 2 }),
      makePoint({ pointNumber: 3, setNumber: 1 }),
    ];

    render(
      <MatchTimelineView
        points={points}
        player1Name="Player 1"
        player2Name="Player 2"
        matchId="match-1"
      />,
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringMatching(/Encountered two children with the same key/i),
    );
    expect(consoleWarn).not.toHaveBeenCalledWith(
      expect.stringMatching(/Encountered two children with the same key/i),
    );

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});
