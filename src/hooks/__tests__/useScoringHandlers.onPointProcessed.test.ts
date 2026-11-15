/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { mockEngineModule, mockReactModule, offlineCtx, winnerFlow } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › onPointProcessed (re-render pós-ponto)', () => {
  it('fila offline (sem setState pós-await) chama onPointProcessed no finally', async () => {
    const onPointProcessed = jest.fn();
    const { ctx } = offlineCtx({ onPointProcessed });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    await act(async () => { await result.current.applyPoint(winnerFlow()); });
    expect(onPointProcessed).toHaveBeenCalledTimes(1);
    expect(ctx.isProcessingRef.current).toBe(false);
  });

  it('chama onPointProcessed mesmo quando o engine lança erro', async () => {
    const onPointProcessed = jest.fn();
    const { ctx, applyPoint } = offlineCtx({ onPointProcessed });
    applyPoint.mockImplementation(() => { throw new Error('boom'); });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    await act(async () => { await result.current.applyPoint(winnerFlow()); });
    expect(onPointProcessed).toHaveBeenCalledTimes(1);
    expect(ctx.isProcessingRef.current).toBe(false);
  });

  it('não chama onPointProcessed quando aborta antes de processar (sem match)', async () => {
    const onPointProcessed = jest.fn();
    const { ctx } = offlineCtx({ match: undefined, onPointProcessed });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    await act(async () => { await result.current.applyPoint(winnerFlow()); });
    expect(onPointProcessed).not.toHaveBeenCalled();
  });
});
