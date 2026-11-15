/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { firstServeError, mockEngineModule, mockReactModule, offlineCtx, serveErrorState } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › firstFaultDetail propagado em Ace (regressão)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('recordAceDirectly inclui firstFaultDetail quando há erro do 1º saque', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: serveErrorState({ serveStep: 'second', firstServeError }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.recordAceDirectly(); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('ACE');
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual(firstServeError);
  });

  it('confirmServerEffect inclui firstFaultDetail e o efeito escolhido', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: serveErrorState({ serveStep: 'second', firstServeError }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServerEffect('flat', 'centro'); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('ACE');
    expect(flow.firstFaultDetail).toEqual(firstServeError);
    expect(flow.rallyDetails.efeito).toBe('flat');
  });

  it('recordAceDirectly omite firstFaultDetail quando não houve falta do 1º saque', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: serveErrorState({ firstServeError: null }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.recordAceDirectly(); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.isSecondServe).toBe(false);
    expect(flow.firstFaultDetail).toBeUndefined();
  });
});
