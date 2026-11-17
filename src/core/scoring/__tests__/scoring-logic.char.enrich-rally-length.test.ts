/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (rallyLength): nullish coalescing por tipo de ponto — valor fornecido,
 * serve finish (1), devolucao (2), rally comum (0) e fallback explícito.
 * Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createHistoryEntry, createPointLog } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — rallyLength', () => {
  it('uses rallyLength from point when provided (nullish coalescing)', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'ACE', rallyLength: 10 }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    // ACTUAL BEHAVIOR: pt.rallyLength ?? (...) uses provided value when not null/undefined
    expect(result[0].rallyLength).toBe(10);
  });

  it('calculates rallyLength as 1 for serve finish when not provided', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'ACE', rallyLength: undefined }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyLength).toBe(1);
  });

  it('calculates rallyLength as 2 for devolucao when not provided', () => {
    const history = [createHistoryEntry({
      point: createPointLog({ type: 'RALLY', rallyDetails: { situacao: 'devolucao' }, rallyLength: undefined }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyLength).toBe(2);
  });

  it('calculates rallyLength as 0 for regular rally when not provided', () => {
    const history = [createHistoryEntry({
      point: createPointLog({ type: 'RALLY', rallyDetails: { situacao: 'rally' }, rallyLength: undefined }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyLength).toBe(0);
  });

  it('uses rallyLength from point when not serve finish or devolucao', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'RALLY', rallyLength: 8 }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyLength).toBe(8);
  });
});
