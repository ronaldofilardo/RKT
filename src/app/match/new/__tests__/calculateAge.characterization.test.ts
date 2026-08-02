import { calculateAgeFromYear } from '../rankingConstants';

describe('calculateAgeFromYear Characterization', () => {
  const currentYear = new Date().getFullYear();

  it('calculates age based only on year difference ignoring month and day', () => {
    expect(calculateAgeFromYear(currentYear)).toBe(0);
    expect(calculateAgeFromYear(currentYear - 10)).toBe(10);
    expect(calculateAgeFromYear(currentYear + 5)).toBe(-5);
  });
});
