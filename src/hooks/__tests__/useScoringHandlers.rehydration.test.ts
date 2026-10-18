import { createMatchFetchService } from '../useScoringHandlers.match-fetch';
import type { ScoringEngine } from '@/core/scoring/engine';

describe('useScoringHandlers.match-fetch - Engine rehydration and undo boundary (D4)', () => {
  const p1 = 'user-1';
  const p2 = 'user-2';

  it('rehydrates engine from lastScoreEdit snapshot and replays subsequent point logs', async () => {
    let currentEngine: ScoringEngine | null = null;
    const engineRef = {
      get current() {
        return currentEngine;
      },
      set current(val) {
        currentEngine = val;
      },
    };

    const setMatch = jest.fn();
    const setScoreState = jest.fn();
    const setPointsHistory = jest.fn();
    const setIsLoading = jest.fn();
    const setError = jest.fn();
    const openRef = { current: jest.fn() };
    const tokenRef = { current: 'mock-token' };
    const matchVersionRef = { current: null };
    const pointSequenceRef = { current: 0 };

    const mockMatchData = {
      id: 'match-123',
      format: 'BEST_OF_3',
      player1: { id: p1, name: 'Alice' },
      player2: { id: p2, name: 'Bob' },
      initialServerId: p1,
      version: 5,
      lastPointSequence: 4,
      scoreState: {
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: 1000,
        secondServe: false,
      },
      lastScoreEdit: {
        id: 'edit-1',
        editedAt: new Date(1000).toISOString(),
        newScoreState: {
          sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
          startedAt: 1000,
          secondServe: false,
          pointLogSequenceAtEdit: 2,
        },
      },
      activeLogsSinceEdit: [
        {
          id: 'log-3',
          winnerId: p1,
          serverId: p1,
          type: 'WINNER',
          sequenceNumber: 3,
          timestamp: new Date(1500).toISOString(),
        },
        {
          id: 'log-4',
          winnerId: p2,
          serverId: p1,
          type: 'WINNER',
          sequenceNumber: 4,
          timestamp: new Date(1600).toISOString(),
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMatchData,
    }) as any;

    const { fetchMatch } = createMatchFetchService({
      matchId: 'match-123',
      tokenRef,
      matchVersionRef,
      pointSequenceRef,
      engineRef,
      openRef,
      setMatch,
      setScoreState,
      setPointsHistory,
      setIsLoading,
      setError,
    });

    await fetchMatch();

    expect(engineRef.current).not.toBeNull();
    // Rehydrated history contains exactly the 2 points played since the edit
    expect(engineRef.current!.getHistoryLength()).toBe(2);

    // Score in current game is 15-15 (1 point for p1, 1 point for p2)
    const state = engineRef.current!.getState();
    expect(state.currentGame.player1).toBe(1);
    expect(state.currentGame.player2).toBe(1);

    // Undo should work and pop point 2
    const undoResult = engineRef.current!.undoLastPoint();
    expect(undoResult).not.toBeNull();
    expect(engineRef.current!.getHistoryLength()).toBe(1);
    expect(engineRef.current!.getState().currentGame.player2).toBe(0);

    // Undo point 1
    const undoResult2 = engineRef.current!.undoLastPoint();
    expect(undoResult2).not.toBeNull();
    expect(engineRef.current!.getHistoryLength()).toBe(0);

    // Third undo at the boundary of the edit returns null (cannot undo before edit)
    const undoResult3 = engineRef.current!.undoLastPoint();
    expect(undoResult3).toBeNull();
  });
});
