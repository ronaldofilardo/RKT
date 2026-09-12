/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useEditScoreCalculator } from '../use-edit-score-calculator';

describe('use-edit-score-calculator - Caracterizacao', () => {
  it('deve calcular validacao de placar e flags de confirmacao', () => {
    const { result } = renderHook(() =>
      useEditScoreCalculator({
        matchFormat: 'BEST_OF_3',
        completedSets: [],
        currentServer: 'player1',
        state: {
          p1Input: '6',
          p2Input: '4',
          newSets: [],
          isFinished: false,
          winner: null,
        } as any,
        tiebreakP1: '',
        tiebreakP2: '',
      })
    );

    expect(result.current.validation).toBeDefined();
    expect(result.current.validation.bothFilled).toBe(true);
    expect(result.current.validation.p1Val).toBe(6);
    expect(result.current.validation.p2Val).toBe(4);
    expect(result.current.canConfirmSet).toBe(true);
  });
});
