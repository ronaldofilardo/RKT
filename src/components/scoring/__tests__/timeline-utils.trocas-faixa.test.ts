import { trocasFaixaLabel } from '../timeline.logic';

describe('trocasFaixaLabel — coluna TROCAS mostra faixas, não número cru (item 2)', () => {
  it('agrupa 1 a 4 trocas na faixa "1-4"', () => {
    expect(trocasFaixaLabel(1)).toBe('1-4');
    expect(trocasFaixaLabel(2)).toBe('1-4');
    expect(trocasFaixaLabel(3)).toBe('1-4');
    expect(trocasFaixaLabel(4)).toBe('1-4');
  });

  it('agrupa 5 a 8 trocas na faixa "5-8"', () => {
    expect(trocasFaixaLabel(5)).toBe('5-8');
    expect(trocasFaixaLabel(8)).toBe('5-8');
  });

  it('agrupa 9 ou mais trocas na faixa "+9"', () => {
    expect(trocasFaixaLabel(9)).toBe('+9');
    expect(trocasFaixaLabel(10)).toBe('+9');
    expect(trocasFaixaLabel(11)).toBe('+9');
    expect(trocasFaixaLabel(25)).toBe('+9');
  });

  it('quando rallyLength é undefined, assume 1 troca (faixa "1-4")', () => {
    expect(trocasFaixaLabel(undefined)).toBe('1-4');
  });
});
