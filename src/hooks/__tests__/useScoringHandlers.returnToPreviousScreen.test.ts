/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { cancelCtx, mockEngineModule, mockReactModule } from './scoringHandlersTestKit';
import { renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › returnToPreviousScreen (regressão: botão Voltar)', () => {
  it('("second") nunca chama undoLastPoint, mesmo com firstServeError setado', () => {
    const { ctx, undoLastPoint } = cancelCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');
    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(ctx.setScoreState).not.toHaveBeenCalled();
    expect(ctx.clearFirstServeError).toHaveBeenCalled();
    expect(ctx.setServeStep).toHaveBeenCalledWith('none');
    expect(ctx.closeAll).toHaveBeenCalled();
  });

  it('("none") desfaz o último ponto direto, sem abrir modal de undo', () => {
    const { ctx, undoLastPoint } = cancelCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('none');
    expect(undoLastPoint).toHaveBeenCalled();
    expect(ctx.clearFirstServeError).not.toHaveBeenCalled();
    expect(ctx.setServeStep).not.toHaveBeenCalled();
    expect(ctx.open).not.toHaveBeenCalledWith('undo');
  });

  it('("second") com processamento ativo não limpa nem desfaz nada', () => {
    const { ctx, undoLastPoint } = cancelCtx({ isProcessingRef: { current: true } });
    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');
    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(ctx.clearFirstServeError).not.toHaveBeenCalled();
    expect(ctx.setServeStep).not.toHaveBeenCalled();
  });
});
