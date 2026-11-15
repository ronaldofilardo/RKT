/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { createMockContext, firstServeError, mockEngineModule, mockReactModule, offlineCtx, pendingServeError } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › recordDirectServeError', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('registra firstServeError sem effect/direction e avança para o 2º saque', () => {
    const ctx = createMockContext({ engineRef: { current: {} as any } });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.recordDirectServeError('out', 'first'); });
    expect(ctx.openServeErrorModal).toHaveBeenCalledWith('out', 'first');
    expect(ctx.setFirstServeError).toHaveBeenCalledWith({ errorType: 'out', serveEffect: undefined, direction: undefined });
    expect(ctx.closeServeErrorModal).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('second');
    expect(ctx.closeAll).toHaveBeenCalled();
  });

  it('emite DOUBLE_FAULT sem effect/direction na 2ª falta, mas com firstFaultDetail da 1ª', () => {
    const { ctx, applyPoint } = offlineCtx({
      serveErrorState: pendingServeError('net', 'second', { serveStep: 'second', firstServeError }),
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.recordDirectServeError('net', 'second'); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('DOUBLE_FAULT');
    expect(flow.firstFaultDetail).toEqual(firstServeError);
    expect(flow.rallyDetails).toMatchObject({ tipo: 'dupla_falta', subtipo2: 'net' });
    expect(flow.rallyDetails.efeito).toBeUndefined();
    expect(flow.rallyDetails.direcao).toBeUndefined();
  });

  it('firstFaultDetail fica undefined quando não há falta do 1º saque', () => {
    const { ctx, applyPoint } = offlineCtx({
      serveErrorState: pendingServeError('out', 'second', { serveStep: 'second', firstServeError: null }),
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.recordDirectServeError('out', 'second'); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('DOUBLE_FAULT');
    expect(flow.firstFaultDetail).toBeUndefined();
  });
});
