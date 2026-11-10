import { isRankingTypeAllowedForProfile, isRankingCategoryAllowed } from '../rankingConstants';

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
});

