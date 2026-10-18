import { executeScoreEdit } from '../useSessionManager.edit-score';

jest.mock('../useSessionManager.state-builder', () => ({
  buildNewScoringState: jest.fn().mockReturnValue({
    sets: [{ player1: 1, player2: 0, isTiebreak: false }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: 1000,
    secondServe: false,
  }),
}));

describe('executeScoreEdit - Session lifecycle (D6)', () => {
  const defaultOptions = {
    setResults: [],
    server: 'player1' as const,
    note: 'Score adjusted',
    ctx: {
      isProcessingRef: { current: false },
      clearPendingEdit: jest.fn(),
      clearQueueForMatch: jest.fn(),
      closeAll: jest.fn(),
    } as any,
    match: {
      id: 'match-1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      version: 1,
    } as any,
    matchId: 'match-1',
    tokenRef: { current: 'token' } as any,
    engineRef: {
      current: {
        loadState: jest.fn(),
      },
    } as any,
    suspendedSession: null,
    persistState: jest.fn().mockResolvedValue({ success: true }),
    fetchMatch: jest.fn().mockResolvedValue(undefined),
    setScoreState: jest.fn(),
    setSessionActive: jest.fn(),
    setSuspendedSession: jest.fn(),
    abandonCurrentSession: jest.fn().mockResolvedValue(true),
    toast: jest.fn(),
  };

  it('keeps annotation session active when match is in progress after score edit (D6)', async () => {
    await executeScoreEdit(defaultOptions);

    expect(defaultOptions.persistState).toHaveBeenCalled();
    expect(defaultOptions.engineRef.current.loadState).toHaveBeenCalled();
    // D6 assertion: session is NOT abandoned and setSessionActive(false) is NOT called!
    expect(defaultOptions.abandonCurrentSession).not.toHaveBeenCalled();
    expect(defaultOptions.setSessionActive).not.toHaveBeenCalled();
    expect(defaultOptions.ctx.closeAll).toHaveBeenCalled();
  });

  it('abandons session and deactivates it when match is finished by score edit', async () => {
    const { buildNewScoringState } = require('../useSessionManager.state-builder');
    buildNewScoringState.mockReturnValueOnce({
      sets: [{ player1: 6, player2: 0, isTiebreak: false }, { player1: 6, player2: 0, isTiebreak: false }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: true,
      winner: 'player1',
      setsWon: { player1: 2, player2: 0 },
      startedAt: 1000,
      secondServe: false,
    });

    const finishOptions = {
      ...defaultOptions,
      abandonCurrentSession: jest.fn().mockResolvedValue(true),
      setSessionActive: jest.fn(),
    };

    const { finishMatch } = require('../useSessionManager.match-finish');
    jest.mock('../useSessionManager.match-finish', () => ({
      finishMatch: jest.fn().mockResolvedValue({ success: true }),
    }));

    await executeScoreEdit(finishOptions);

    expect(finishOptions.abandonCurrentSession).toHaveBeenCalled();
    expect(finishOptions.setSessionActive).toHaveBeenCalledWith(false);
  });
});
