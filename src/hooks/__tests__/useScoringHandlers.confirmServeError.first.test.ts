/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { createMockContext, mockEngineModule, mockReactModule, pendingServeError } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › confirmServeError › erro no 1º saque', () => {
  it('fecha o modal e avança para o segundo saque', () => {
    const ctx = createMockContext({
      serveErrorState: pendingServeError('out', 'first'),
      engineRef: { current: {} as any },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.confirmServeError('flat', 'cruzada');
    expect(ctx.setFirstServeError).toHaveBeenCalledWith({
      errorType: 'out',
      serveEffect: 'flat',
      direction: 'cruzada',
    });
    expect(ctx.closeServeErrorModal).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('second');
    expect(ctx.closeAll).toHaveBeenCalled();
  });

  it('registra effect/direction undefined quando não informados', () => {
    const ctx = createMockContext({
      serveErrorState: pendingServeError('net', 'first'),
      engineRef: { current: {} as any },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.confirmServeError(undefined, undefined);
    expect(ctx.setFirstServeError).toHaveBeenCalledWith({
      errorType: 'net',
      serveEffect: undefined,
      direction: undefined,
    });
    expect(ctx.closeAll).toHaveBeenCalled();
  });
});
