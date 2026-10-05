import { addScoreEditBreaks } from '../route.timeline.helpers';
import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '@/core/scoring/timeline-rebuild';

describe('addScoreEditBreaks', () => {
  it('returns timelinePoints unmodified if scoreEdits is empty', () => {
    const timelinePoints: TimelinePoint[] = [{
      id: 'pt-1',
      matchId: 'match-1',
      setNumber: 1,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 0, player2: 0 },
      pointWinner: 'PLAYER_1',
      isTiebreak: false,
      gameIsDeuce: false,
      gameAdvantage: null,
      server: 'PLAYER_1',
      receiver: 'PLAYER_2',
      eventNumber: 1,
      matchFinished: false
    }];
    const pointLogs: PointLogRow[] = [{
      id: 'log-1',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      pointData: {} as any
    }];
    
    const result = addScoreEditBreaks(timelinePoints, pointLogs, []);
    
    expect(result).toBe(timelinePoints);
  });

  it('adds segmentBreak to the point after the edit time', () => {
    const timelinePoints: TimelinePoint[] = [
      {
        id: 'pt-1',
        matchId: 'match-1',
        setNumber: 1,
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 15, player2: 0 },
        pointWinner: 'PLAYER_1',
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        server: 'PLAYER_1',
        receiver: 'PLAYER_2',
        eventNumber: 1,
        matchFinished: false
      },
      {
        id: 'pt-2',
        matchId: 'match-1',
        setNumber: 1,
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 30, player2: 0 },
        pointWinner: 'PLAYER_1',
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        server: 'PLAYER_1',
        receiver: 'PLAYER_2',
        eventNumber: 2,
        matchFinished: false
      }
    ];

    const pointLogs: PointLogRow[] = [
      { id: 'log-1', timestamp: new Date('2023-01-01T10:00:00Z'), pointData: {} as any },
      { id: 'log-2', timestamp: new Date('2023-01-01T10:05:00Z'), pointData: {} as any }
    ];

    const edits = [
      {
        id: 'edit-1',
        matchId: 'match-1',
        editedAt: new Date('2023-01-01T10:02:00Z'), // Between log-1 and log-2
        editedByUserId: 'user-1',
        previousScoreState: { sets: [], currentGame: { player1: 15, player2: 0 } },
        newScoreState: { sets: [], currentGame: { player1: 0, player2: 15 } },
        note: 'Correction'
      }
    ] as any;

    const result = addScoreEditBreaks(timelinePoints, pointLogs, edits);

    expect(result[0]).not.toHaveProperty('segmentBreak');
    expect(result[1]).toHaveProperty('segmentBreak');
    expect(result[1].segmentBreak).toEqual({
      editedAt: edits[0].editedAt.toISOString(),
      previousLabel: 'Set 1 · Game 0x0 · 15x0',
      newLabel: 'Set 1 · Game 0x0 · 0x15',
      editedByUserId: 'user-1',
      note: 'Correction'
    });
  });

  it('handles multiple edits between points', () => {
    const timelinePoints: TimelinePoint[] = [
      {
        id: 'pt-1',
        matchId: 'match-1',
        setNumber: 1,
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 15, player2: 0 },
        pointWinner: 'PLAYER_1',
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        server: 'PLAYER_1',
        receiver: 'PLAYER_2',
        eventNumber: 1,
        matchFinished: false
      },
      {
        id: 'pt-2',
        matchId: 'match-1',
        setNumber: 1,
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 30, player2: 0 },
        pointWinner: 'PLAYER_1',
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        server: 'PLAYER_1',
        receiver: 'PLAYER_2',
        eventNumber: 2,
        matchFinished: false
      }
    ];

    const pointLogs: PointLogRow[] = [
      { id: 'log-1', timestamp: new Date('2023-01-01T10:00:00Z'), pointData: {} as any },
      { id: 'log-2', timestamp: new Date('2023-01-01T10:05:00Z'), pointData: {} as any }
    ];

    const edits = [
      {
        id: 'edit-1',
        matchId: 'match-1',
        editedAt: new Date('2023-01-01T10:02:00Z'),
        editedByUserId: 'user-1',
        previousScoreState: null,
        newScoreState: null,
        note: 'First edit'
      },
      {
        id: 'edit-2',
        matchId: 'match-1',
        editedAt: new Date('2023-01-01T10:03:00Z'),
        editedByUserId: 'user-1',
        previousScoreState: null,
        newScoreState: null,
        note: 'Second edit'
      }
    ] as any;

    const result = addScoreEditBreaks(timelinePoints, pointLogs, edits);

    expect(result[1].segmentBreak).toBeDefined();
    expect(result[1].segmentBreak?.note).toBe('First edit → Second edit');
    expect(result[1].segmentBreak?.previousLabel).toBe('Set 1 · Game 0x0 · 15x0');
    expect(result[1].segmentBreak?.newLabel).toBe('Set 1 · Game 0x0 · 30x0');
  });

  it('handles edit before any point (index 0)', () => {
    const timelinePoints: TimelinePoint[] = [
      {
        id: 'pt-1',
        matchId: 'match-1',
        setNumber: 1,
        gamesScore: { player1: 0, player2: 0 },
        gameScore: { player1: 15, player2: 0 },
        pointWinner: 'PLAYER_1',
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        server: 'PLAYER_1',
        receiver: 'PLAYER_2',
        eventNumber: 1,
        matchFinished: false
      }
    ];

    const pointLogs: PointLogRow[] = [
      { id: 'log-1', timestamp: new Date('2023-01-01T10:05:00Z'), pointData: {} as any },
    ];

    const edits = [
      {
        id: 'edit-1',
        matchId: 'match-1',
        editedAt: new Date('2023-01-01T10:02:00Z'),
        editedByUserId: 'user-1',
        previousScoreState: null,
        newScoreState: null,
        note: 'Initial edit'
      }
    ] as any;

    const result = addScoreEditBreaks(timelinePoints, pointLogs, edits);

    expect(result[0].segmentBreak).toBeDefined();
    expect(result[0].segmentBreak?.previousLabel).toBe('–');
  });
});
