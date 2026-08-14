import { trocasFaixaLabel } from '../timeline-utils';

describe('trocasFaixaLabel — coluna TROCAS mostra faixas, não número cru (item 2)', () => {
  it('agrupa 1 e 2 trocas na faixa "1-2"', () => {
    expect(trocasFaixaLabel(1)).toBe('1-2');
    expect(trocasFaixaLabel(2)).toBe('1-2');
  });

  it('agrupa 3 a 6 trocas na faixa "3-6"', () => {
    expect(trocasFaixaLabel(3)).toBe('3-6');
    expect(trocasFaixaLabel(6)).toBe('3-6');
  });

  it('agrupa 7 a 10 trocas na faixa "7-10"', () => {
    expect(trocasFaixaLabel(7)).toBe('7-10');
    expect(trocasFaixaLabel(10)).toBe('7-10');
  });

  it('agrupa 11 ou mais trocas na faixa "11+"', () => {
    expect(trocasFaixaLabel(11)).toBe('11+');
    expect(trocasFaixaLabel(25)).toBe('11+');
  });

  it('quando rallyLength é undefined, assume 1 troca (faixa "1-2")', () => {
    expect(trocasFaixaLabel(undefined)).toBe('1-2');
  });
});
