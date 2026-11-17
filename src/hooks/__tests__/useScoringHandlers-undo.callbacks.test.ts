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

describe('useScoringHandlers - undoLastPoint (callbacks e persistência)', () => {
  beforeEach(undoTestSetup);
  afterEach(undoTestTeardown);

  it('deve chamar closeAll() após desfazer o ponto', async () => {
    const engine = undoEngine({
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      game: [1, 0],
    });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    await result.current.undoLastPoint();

    expect(engine.undoLastPoint).toHaveBeenCalled();
    expect(ctx.setScoreState).toHaveBeenCalled();
    expect(ctx.closeAll).toHaveBeenCalled();
  });

  it('deve chamar onUndoComplete() após desfazer o ponto com sucesso', async () => {
    const engine = undoEngine({
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      game: [1, 0],
    });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    await result.current.undoLastPoint();

    expect(ctx.onUndoComplete).toHaveBeenCalled();
  });

  it('deve atualizar o pointsHistory ao desfazer', () => {
    const engine = undoEngine({
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      game: [1, 0],
    });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.undoLastPoint();

    expect(ctx.setPointsHistory).toHaveBeenCalledWith(expect.any(Function));
  });

  it('deve persistir o estado após o undo', async () => {
    const engine = undoEngine({
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      game: [1, 0],
      undoResult: { point: { type: 'WINNER', winnerId: 'p1' } },
    });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.undoLastPoint();

    expect(engine.getState).toHaveBeenCalled();
  });
});
