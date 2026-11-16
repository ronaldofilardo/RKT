/**
 * CHARACTERIZATION — edit-score-state (calculateValidation: tiebreakImpossible e contradição de vencedor de tie-break).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { validate } from './editScoreStateTestKit';

describe('calculateValidation - tiebreakImpossible', () => {
  it('deve retornar tiebreakImpossible=false para tiebreak 7x5 (válido)', () => {
    const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '7', tiebreakP2: '5' });

    expect(result.tiebreakImpossible).toBe(false);
    expect(result.isSetTrulyCompleted).toBe(true);
  });

  it('deve retornar tiebreakImpossible=true para tiebreak 7x10 (impossível)', () => {
    const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '7', tiebreakP2: '10' });

    expect(result.tiebreakImpossible).toBe(true);
    expect(result.isSetTrulyCompleted).toBe(false);
    expect(result.setValidationError).toContain('impossível');
  });

  it('deve retornar tiebreakImpossible=true para tiebreak 13x8 (impossível)', () => {
    const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '13', tiebreakP2: '8' });

    expect(result.tiebreakImpossible).toBe(true);
    expect(result.isSetTrulyCompleted).toBe(false);
  });

  it('deve retornar tiebreakImpossible=false para tiebreak 8x6 (válido)', () => {
    const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '8', tiebreakP2: '6' });

    expect(result.tiebreakImpossible).toBe(false);
    expect(result.isSetTrulyCompleted).toBe(true);
  });

  it('deve retornar tiebreakImpossible=false para tiebreak 7x7 (incompleto)', () => {
    const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '7', tiebreakP2: '7' });

    expect(result.tiebreakImpossible).toBe(false);
    expect(result.isSetTrulyCompleted).toBe(false);
  });

  it('deve retornar tiebreakImpossible=false quando não há tiebreak obrigatório', () => {
    const result = validate({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3', totalEditedSets: 1 });

    expect(result.tiebreakImpossible).toBe(false);
    expect(result.isSetTrulyCompleted).toBe(true);
  });
});

describe('calculateValidation - contradição de vencedor de tie-break', () => {
  it('deve retornar erro de contradição quando jogador 2 vence o set mas jogador 1 vence o tie-break', () => {
    const result = validate({ p1Input: '6', p2Input: '7', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '7', tiebreakP2: '5' });

    expect(result.isSetTrulyCompleted).toBe(false);
    expect(result.setValidationError).toBe('Vencedor do tie-break não corresponde ao vencedor do set');
  });

  it('deve retornar erro de contradição quando jogador 1 vence o set mas jogador 2 vence o tie-break', () => {
    const result = validate({ p1Input: '7', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '5', tiebreakP2: '7' });

    expect(result.isSetTrulyCompleted).toBe(false);
    expect(result.setValidationError).toBe('Vencedor do tie-break não corresponde ao vencedor do set');
  });

  it('NÃO deve retornar erro de contradição quando tie-break e set têm o mesmo vencedor (P1)', () => {
    const result = validate({ p1Input: '7', p2Input: '6', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '7', tiebreakP2: '5' });

    expect(result.isSetTrulyCompleted).toBe(true);
    expect(result.setValidationError).toBeUndefined();
  });

  it('NÃO deve retornar erro de contradição quando tie-break e set têm o mesmo vencedor (P2)', () => {
    const result = validate({ p1Input: '6', p2Input: '7', matchFormat: 'BEST_OF_3', totalEditedSets: 1, tiebreakP1: '5', tiebreakP2: '7' });

    expect(result.isSetTrulyCompleted).toBe(true);
    expect(result.setValidationError).toBeUndefined();
  });
});
