import {
  computeAthleteAge,
  formatBirthDate,
  genderLabel,
  normalizeDominance,
  normalizeGender,
} from '../athlete-labels.logic';

describe('athlete-labels.logic', () => {
  it('normaliza gênero dos dois vocabulários', () => {
    expect(normalizeGender('MALE')).toBe('MALE');
    expect(normalizeGender('MASCULINO')).toBe('MALE');
    expect(normalizeGender('FEMININO')).toBe('FEMALE');
    expect(normalizeGender('OUTRO')).toBeUndefined();
  });

  it('normaliza lateralidade', () => {
    expect(normalizeDominance('DESTRO')).toBe('RIGHT');
    expect(normalizeDominance('LEFT')).toBe('LEFT');
    expect(normalizeDominance('AMBIDEXTRO')).toBeUndefined();
  });

  it('exibe gênero como Masculino/Feminino', () => {
    expect(genderLabel('MALE')).toBe('Masculino');
    expect(genderLabel('FEMININO')).toBe('Feminino');
    expect(genderLabel(null)).toBe('-');
  });

  it('formata data sem deslocar fuso', () => {
    expect(formatBirthDate('2001-01-01T00:00:00.000Z')).toBe('01/01/2001');
    expect(formatBirthDate(null)).toBeNull();
  });

  it('calcula idade pela data completa e, sem ela, usa a idade gravada', () => {
    const today = new Date(2026, 9, 30);
    expect(computeAthleteAge('2001-10-31', null, today)).toBe(24);
    expect(computeAthleteAge('2001-10-30', null, today)).toBe(25);
    expect(computeAthleteAge(null, 15, today)).toBe(15);
    expect(computeAthleteAge(null, null, today)).toBeNull();
  });
});
