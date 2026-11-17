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

describe('useScoringHandlers - undoLastPoint (guardas de entrada)', () => {
  beforeEach(undoTestSetup);
  afterEach(undoTestTeardown);

  it('não deve fazer nada se engineRef.current for null', () => {
    const ctx = createUndoContext();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.undoLastPoint();

    expect(ctx.setScoreState).not.toHaveBeenCalled();
    expect(ctx.closeAll).not.toHaveBeenCalled();
    expect(ctx.onUndoComplete).not.toHaveBeenCalled();
  });

  it('não deve fazer nada se undoLastPoint retornar null', () => {
    const engine = undoEngine({ withoutState: true, undoResult: null });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.undoLastPoint();

    expect(ctx.setScoreState).not.toHaveBeenCalled();
    expect(ctx.closeAll).not.toHaveBeenCalled();
    expect(ctx.onUndoComplete).not.toHaveBeenCalled();
  });
});
