/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { createMockContext, engineRefWith, firstServeError, mockEngineModule, mockReactModule, offlineCtx, pendingServeError } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › confirmServeError › double fault', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('limpa o estado após aplicar o ponto agendado no debounce', async () => {
    const ctx = createMockContext({ serveErrorState: pendingServeError('out', 'second'), engineRef: engineRefWith() });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServeError('flat', 'cruzada'); });
    expect(ctx.closeAll).toHaveBeenCalled();
    await act(async () => { jest.runAllTimers(); });
    expect(ctx.clearFirstServeError).toHaveBeenCalled();
    expect(ctx.closeServeErrorModal).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
  });

  it('propaga firstFaultDetail da 1ª falta no fluxo DOUBLE_FAULT', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: pendingServeError('net', 'second', { firstServeError }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServeError(undefined, undefined); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('DOUBLE_FAULT');
    expect(flow.firstFaultDetail).toEqual(firstServeError);
    expect(flow.rallyDetails).toMatchObject({ tipo: 'dupla_falta', subtipo2: 'net' });
  });

  it('não cria placeholder de firstFaultDetail quando não há falta anterior', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: pendingServeError('net', 'second', { firstServeError: null }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServeError(undefined, undefined); });
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.firstFaultDetail).toBeUndefined();
    expect(flow.rallyDetails.efeito).toBeUndefined();
    expect(flow.rallyDetails.direcao).toBeUndefined();
  });
});
