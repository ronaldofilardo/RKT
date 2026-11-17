/**
 * Split de timeline-utils.test.ts — describe "formatAceOrDf": casos de ACE
 * (1º/2º saque, efeito/direção e fallbacks). Asserções 1:1.
 */
import { formatAceOrDf } from '../timeline.logic';

describe('formatAceOrDf — ACE', () => {
  it('deve formatar ACE simples (1º saque por padrão)', () => {
    const point = { type: 'ACE', isSecondServe: false, rallyDetails: null, firstFault: null } as any;
    expect(formatAceOrDf(point)).toBe('1º ACE');
  });

  it('deve formatar ACE no 2º saque', () => {
    const point = { type: 'ACE', isSecondServe: true, rallyDetails: null, firstFault: null } as any;
    expect(formatAceOrDf(point)).toBe('2º ACE');
  });

  it('deve formatar ACE com efeito e direção', () => {
    const point = {
      type: 'ACE',
      isSecondServe: false,
      rallyDetails: { efeito: 'topspin', direcao: 'cruzada' },
      firstFault: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('1º ACE-TOP-CRU');
  });

  it('deve formatar ACE com efeito desconhecido (fallback to upper case)', () => {
    const point = {
      type: 'ACE',
      isSecondServe: false,
      rallyDetails: { efeito: 'unknown_effect', direcao: 'cruzada' },
      firstFault: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('1º ACE-UNK-CRU');
  });

  it('deve formatar ACE com direção desconhecida (fallback to upper case)', () => {
    const point = {
      type: 'ACE',
      isSecondServe: false,
      rallyDetails: { efeito: 'topspin', direcao: 'unknown_dir' },
      firstFault: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('1º ACE-TOP-UNK');
  });
});
