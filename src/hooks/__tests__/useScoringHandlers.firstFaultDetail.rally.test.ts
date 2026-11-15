/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { firstServeError, mockEngineModule, mockReactModule, rallyCtx, serveErrorState } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › firstFaultDetail propagado em rally comum (regressão)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('confirmPointDetails inclui firstFaultDetail quando há erro do 1º saque', () => {
    const { ctx, applyPoint } = rallyCtx({ serveErrorState: serveErrorState({ serveStep: 'second', firstServeError }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmPointDetails({ tipo: 'winner' as const, previewBalls: 5 }); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('WINNER');
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual(firstServeError);
  });

  it('confirmPointDetails omite firstFaultDetail quando o ponto termina no 1º saque', () => {
    const { ctx, applyPoint } = rallyCtx({ serveErrorState: serveErrorState({ firstServeError: null }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmPointDetails({ tipo: 'winner' as const, previewBalls: 5 }); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.firstFaultDetail).toBeUndefined();
  });

  it('winner do sacador com rallyLength 1 registra WINNER, jamais ACE', () => {
    const { ctx, applyPoint } = rallyCtx({ serveErrorState: serveErrorState({ firstServeError: null }) }, '1');
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmPointDetails({ tipo: 'winner' as const, previewBalls: 1 }); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('WINNER');
    expect(flow.type).not.toBe('ACE');
  });
});
