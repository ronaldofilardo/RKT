/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { cancelCtx, mockEngineModule, mockReactModule, serveErrorState } from './scoringHandlersTestKit';
import { renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › cancelServeError (regressão: voltar não mexe no placar)', () => {
  it('em serveStep "second" nunca chama undoLastPoint e limpa o estado', () => {
    const { ctx, undoLastPoint } = cancelCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.cancelServeError();
    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(ctx.setScoreState).not.toHaveBeenCalled();
    expect(ctx.clearFirstServeError).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
  });

  it('em serveStep "first" também limpa sem desfazer ponto (estado não fica preso)', () => {
    const { ctx, undoLastPoint } = cancelCtx({
      serveErrorState: serveErrorState({ serveStep: 'first', firstServeError: { errorType: 'net' } }),
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.cancelServeError();
    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(ctx.clearFirstServeError).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
  });
});
