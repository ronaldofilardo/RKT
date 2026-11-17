/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockUndoEngineModule());
jest.mock('react', () => mockReactModule());

import {
  createUndoContext,
  mockReactModule,
  mockUndoEngineModule,
  undoEngine,
  undoTestSetup,
  undoTestTeardown,
} from './scoringHandlersUndoTestKit';
import { renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers - returnToPreviousScreen', () => {
  beforeEach(undoTestSetup);
  afterEach(undoTestTeardown);

  it('deve executar undo diretamente (sem modal) quando serveStep é "none"', () => {
    const engine = undoEngine({
      startedAt: null,
      undoResult: { point: { type: 'WINNER' } },
      historyLength: 0,
      withIsFinished: true,
    });
    const ctx = createUndoContext({
      engineRef: { current: engine },
      pointsHistory: [{
        pointNumber: 1,
        server: 'player1',
        receiver: 'player2',
        serverScore: '15',
        receiverScore: '0',
        gameScore: { player1: 0, player2: 0 },
        gamesScore: { player1: 0, player2: 0 },
        winner: 'PLAYER_1',
      } as any],
    });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('none');

    expect(ctx.open).not.toHaveBeenCalledWith('undo');
    expect(ctx.setScoreState).toHaveBeenCalled();
  });

  it('deve resetar o 2º saque diretamente (sem modal) quando serveStep é "second"', () => {
    const ctx = createUndoContext();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');

    expect(ctx.open).not.toHaveBeenCalled();
    expect(ctx.clearFirstServeError).toHaveBeenCalled();
    expect(ctx.closeServeErrorModal).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
    expect(ctx.closeAll).toHaveBeenCalled();
  });

  it('deve cancelar o debounce pendente ao resetar o 2º saque', () => {
    jest.useFakeTimers();
    const debounceTimerRef = { current: setTimeout(() => undefined, 1000) };
    const ctx = createUndoContext({ debounceTimerRef });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');

    expect(debounceTimerRef.current).toBeNull();
    expect(ctx.isProcessingRef.current).toBe(false);
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
  });
});
