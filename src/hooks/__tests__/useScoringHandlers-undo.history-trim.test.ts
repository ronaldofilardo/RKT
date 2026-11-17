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

describe('useScoringHandlers - undoLastPoint (trim de histórico)', () => {
  beforeEach(undoTestSetup);
  afterEach(undoTestTeardown);

  it('deve desfazer só a jogada de dupla falta (1 entrada de histórico), sem apagar o ponto anterior', async () => {
    // BUG FIX (2026-09-27): erro de 1º saque nunca gera uma entrada própria
    // no histórico do engine (é só estado local em serve-actions.service.ts);
    // a jogada inteira (erro 1º saque + dupla falta) é UM único ponto salvo
    // via saveToHistory em engine.ts. Este teste antes simulava uma 2ª
    // entrada "FAULT_FIRST" que não existe em produção e mascarava o bug de
    // undoLastPoint apagar também o ponto anterior (ex.: 15/0 → 15/15 → Voltar
    // → 0/0 em vez de voltar a 15/0).
    const engine = undoEngine({
      undoOnce: { point: { type: 'DOUBLE_FAULT' } },
      historyLength: null,
    });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    await result.current.undoLastPoint();

    expect(engine.undoLastPoint).toHaveBeenCalledTimes(1);
    expect(ctx.setScoreState).toHaveBeenCalled();
    expect(ctx.setPointsHistory).toHaveBeenCalledWith(expect.any(Function));
    const trimHistory = ctx.setPointsHistory.mock.calls[0][0];
    expect(trimHistory(['ponto-anterior-15-0', 'dupla-falta'])).toEqual(['ponto-anterior-15-0']);
    expect(ctx.closeAll).toHaveBeenCalled();
  });
});
