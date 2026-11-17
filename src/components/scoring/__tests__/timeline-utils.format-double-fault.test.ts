/**
 * Split de timeline-utils.test.ts — describe "formatAceOrDf": casos de
 * DOUBLE_FAULT/FAULT_SECOND e o fallback de tipo desconhecido. Asserções 1:1.
 */
import { formatAceOrDf } from '../timeline.logic';

describe('formatAceOrDf — DOUBLE_FAULT e fallback', () => {
  it('deve formatar DOUBLE_FAULT', () => {
    const point = {
      type: 'DOUBLE_FAULT',
      firstFault: { serveEffect: 'flat', direction: 'aberto' },
      rallyDetails: { efeito: 'slice', direcao: 'centro' },
    } as any;
    expect(formatAceOrDf(point)).toBe('DF: 1o.-Fla-Abe > 2o.-Sli-Cen');
  });

  it('deve formatar DOUBLE_FAULT com direction no firstFault', () => {
    const point = {
      type: 'DOUBLE_FAULT',
      firstFault: { serveEffect: 'slice', direction: 'paralela' },
      rallyDetails: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('DF: 1o.-Sli-Par > 2o.');
  });

  it('deve formatar DOUBLE_FAULT com firstFault sem serveEffect nem direction (linha 68)', () => {
    const point = {
      type: 'DOUBLE_FAULT',
      firstFault: {},
      rallyDetails: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('DF: 1o. > 2o.');
  });

  it('deve formatar FAULT_SECOND', () => {
    const point = {
      type: 'FAULT_SECOND',
      firstFault: { serveEffect: 'slice' },
      rallyDetails: null,
    } as any;
    expect(formatAceOrDf(point)).toBe('DF: 1o.-Sli > 2o.');
  });

  it('deve formatar FAULT_SECOND com rallyDetails', () => {
    const point = {
      type: 'FAULT_SECOND',
      firstFault: { serveEffect: 'flat' },
      rallyDetails: { efeito: 'topspin', direcao: 'cruzada' },
    } as any;
    expect(formatAceOrDf(point)).toBe('DF: 1o.-Fla > 2o.-Top-Cru');
  });

  it('deve retornar – para tipo desconhecido', () => {
    const point = { type: 'UNKNOWN_TYPE' } as any;
    expect(formatAceOrDf(point)).toBe('–');
  });
});
