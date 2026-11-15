/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { firstServeError, mockEngineModule, mockReactModule, offlineCtx, pendingServeError } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › cancelar aborta ponto fantasma (debounce)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('cancelServeError cancela o timer de um Ace agendado (confirmServerEffect)', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: pendingServeError('net', 'second') });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServerEffect('flat', 'centro'); });
    expect(ctx.debounceTimerRef.current).not.toBeNull();
    expect(ctx.isProcessingRef.current).toBe(false);
    act(() => { result.current.cancelServeError(); });
    expect(ctx.debounceTimerRef.current).toBeNull();
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).not.toHaveBeenCalled();
  });

  it('returnToPreviousScreen("second") cancela o timer de uma Dupla Falta agendada', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: pendingServeError('net', 'second', { firstServeError }) });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServeError('flat', 'centro'); });
    expect(ctx.debounceTimerRef.current).not.toBeNull();
    expect(ctx.isProcessingRef.current).toBe(false);
    act(() => { result.current.returnToPreviousScreen('second'); });
    expect(ctx.debounceTimerRef.current).toBeNull();
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).not.toHaveBeenCalled();
  });

  it('returnToPreviousScreen("second") também cancela o timer pendente de um Ace', () => {
    const { ctx, applyPoint } = offlineCtx({ serveErrorState: pendingServeError('net', 'second') });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    act(() => { result.current.confirmServerEffect('flat', 'centro'); });
    expect(ctx.debounceTimerRef.current).not.toBeNull();
    act(() => { result.current.returnToPreviousScreen('second'); });
    expect(ctx.debounceTimerRef.current).toBeNull();
    act(() => { jest.runAllTimers(); });
    expect(applyPoint).not.toHaveBeenCalled();
  });
});
