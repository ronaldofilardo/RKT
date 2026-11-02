import { BRAZILIAN_UFS, BrazilianUF, isBrazilianUF } from '../brazilian-states';

describe('brazilian-states', () => {
  it('deve exportar exatamente 27 UFs', () => {
    expect(BRAZILIAN_UFS).toHaveLength(27);
  });

  it('deve conter todas as UFs brasileiras padronizadas', () => {
    const expected = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ];
    expected.forEach((uf) => {
      expect(BRAZILIAN_UFS).toContain(uf as BrazilianUF);
    });
  });

  it('isBrazilianUF deve retornar true para UFs validas', () => {
    expect(isBrazilianUF('SP')).toBe(true);
    expect(isBrazilianUF('RJ')).toBe(true);
    expect(isBrazilianUF('DF')).toBe(true);
  });

  it('isBrazilianUF deve retornar false para siglas invalidas', () => {
    expect(isBrazilianUF('XX')).toBe(false);
    expect(isBrazilianUF('')).toBe(false);
    expect(isBrazilianUF(null)).toBe(false);
    expect(isBrazilianUF(undefined)).toBe(false);
    expect(isBrazilianUF(123)).toBe(false);
  });
});
