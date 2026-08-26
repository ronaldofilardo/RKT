/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { ScoringEngine } from '@/core/scoring/engine';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoringHandlersContext } from '@/hooks/useScoringHandlers.types';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

function createContext(): ScoringHandlersContext {
  const engine = new ScoringEngine({
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  });
  const serveErrorState: ScoreboardUIState = {
    serveStep: 'none',
    firstServeError: null,
    pendingServeError: null,
    pendingDoubleFault: false,
    serveErrorStage: null,
    isServeErrorModalOpen: false,
  };

  return {
    matchId: 'match-1',
    match: {
      id: 'match-1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      initialServerId: 'p1',
      scoreState: null,
      state: 'IN_PROGRESS',
    },
    isOnline: false,
    enqueue: jest.fn().mockResolvedValue(undefined),
    engineRef: { current: engine },
    tokenRef: { current: 'test-token' },
    modalParamsRef: { current: {} },
    openRef: { current: jest.fn() },
    pointSequenceRef: { current: 0 },
    serveErrorState,
    setMatch: jest.fn(),
    setScoreState: jest.fn(),
    setIsLoading: jest.fn(),
    setError: jest.fn(),
    setSetupLoading: jest.fn(),
    setPointsHistory: jest.fn(),
    setShowFinishedBanner: jest.fn(),
    handleServeErrorClose: jest.fn(),
    handleFirstServeErrorSet: jest.fn(),
    handleFirstServeErrorClear: jest.fn(),
    setServeStep: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    closeAll: jest.fn(),
    isProcessingRef: { current: false },
    debounceTimerRef: { current: null },
  };
}

describe('useScoringHandlers — regressão real do ACE direto', () => {
  it('registra ACE para o sacador e encerra o fluxo sem detalhes', async () => {
    const context = createContext();
    const { result } = renderHook(() => useScoringHandlers(context));

    act(() => {
      result.current.handleAceDirect();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const point = context.engineRef.current?.getPointHistory()[0]?.point;
    expect(point).toEqual(expect.objectContaining({
      type: 'ACE',
      winnerId: 'p1',
      serverId: 'p1',
      isFirstServe: true,
      isSecondServe: false,
      rallyLength: 1,
    }));
    expect(context.closeAll).toHaveBeenCalledTimes(1);
    expect(context.handleFirstServeErrorClear).toHaveBeenCalledTimes(1);
    expect(context.setServeStep).toHaveBeenCalledWith('none');
  });
});
