import { isRankingTypeAllowedForProfile, isRankingCategoryAllowed, getOfficialCategoryForAge } from '../rankingConstants';

describe('ranking eligibility for adults and profile compatibility', () => {
  it('permite ranking ESTADUAL para adultos (19–34 anos)', () => {
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 19, 'MALE')).toBe(true);
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 25, 'FEMALE')).toBe(true);
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 34, 'MALE')).toBe(true);
  });

  it('permite ranking ESTADUAL para juvenis (>= 11 anos) e veteranos (>= 35 anos)', () => {
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 11, 'MALE')).toBe(true);
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 14, 'FEMALE')).toBe(true);
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 40, 'MALE')).toBe(true);
  });

  it('não permite ranking ESTADUAL para idade abaixo de 11 anos', () => {
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 10, 'MALE')).toBe(false);
    expect(isRankingTypeAllowedForProfile('ESTADUAL', 8, 'FEMALE')).toBe(false);
  });

  it('permite ESTADUAL quando idade é null (não informada)', () => {
    expect(isRankingTypeAllowedForProfile('ESTADUAL', null, 'MALE')).toBe(true);
  });

  it('categoria vazia é válida para adulto no ranking ESTADUAL', () => {
    expect(isRankingCategoryAllowed('ESTADUAL', undefined, 19)).toBe(true);
    expect(isRankingCategoryAllowed('ESTADUAL', '', 19)).toBe(true);
  });

  it('categoria juvenil 13-14 é inválida para adulto no ranking ESTADUAL', () => {
    expect(isRankingCategoryAllowed('ESTADUAL', '13-14', 19)).toBe(false);
  });

  describe('getOfficialCategoryForAge (categoria oficial por idade - estrita)', () => {
    it('retorna a categoria oficial estrita para juvenis sem amplitude máxima 13 a 18 anos', () => {
      // Atleta X nascida em 29/11/2011 tem 15 anos em 2026
      const cat15 = getOfficialCategoryForAge(15);
      expect(cat15).toEqual({ label: 'Infanto-juvenil', ageLabel: '15/16 anos (até 16 anos)' });

      const cat16 = getOfficialCategoryForAge(16);
      expect(cat16).toEqual({ label: 'Infanto-juvenil', ageLabel: '15/16 anos (até 16 anos)' });

      const cat14 = getOfficialCategoryForAge(14);
      expect(cat14).toEqual({ label: 'Infanto-juvenil', ageLabel: '13/14 anos (até 14 anos)' });

      const cat12 = getOfficialCategoryForAge(12);
      expect(cat12).toEqual({ label: 'Infanto-juvenil', ageLabel: '11/12 anos (até 12 anos)' });

      const cat18 = getOfficialCategoryForAge(18);
      expect(cat18).toEqual({ label: 'Infanto-juvenil', ageLabel: '17/18 anos (até 18 anos)' });
    });

    it('quando é juvenil (<= 18 anos), nunca retorna categoria adulto', () => {
      for (const age of [11, 12, 13, 14, 15, 16, 17, 18]) {
        const cat = getOfficialCategoryForAge(age);
        expect(cat?.label).toBe('Infanto-juvenil');
        expect(cat?.label).not.toBe('Adulto');
        expect(cat?.ageLabel).not.toContain('19 a 34');
        expect(cat?.ageLabel).not.toBe('13 a 18 anos');
      }
    });

    it('retorna categoria adulto para 19 a 34 anos', () => {
      expect(getOfficialCategoryForAge(19)).toEqual({ label: 'Adulto', ageLabel: '19 a 34 anos' });
      expect(getOfficialCategoryForAge(28)).toEqual({ label: 'Adulto', ageLabel: '19 a 34 anos' });
      expect(getOfficialCategoryForAge(34)).toEqual({ label: 'Adulto', ageLabel: '19 a 34 anos' });
    });

    it('retorna faixas específicas de veterano para >= 35 anos', () => {
      expect(getOfficialCategoryForAge(35)).toEqual({ label: 'Veterano', ageLabel: '35 a 39 anos' });
      expect(getOfficialCategoryForAge(42)).toEqual({ label: 'Veterano', ageLabel: '40 a 44 anos' });
    });
  });
});

