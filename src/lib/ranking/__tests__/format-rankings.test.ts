import { formatRankings, formatRankingDate } from '../format-rankings';

describe('formatRankingDate', () => {
  it('formata data ISO YYYY-MM-DD em "DD mmm AA"', () => {
    expect(formatRankingDate('2026-11-17')).toBe('17 nov 26');
    expect(formatRankingDate('2026-01-05')).toBe('5 jan 26');
    expect(formatRankingDate('2025-12-31')).toBe('31 dez 25');
  });

  it('retorna null se data for nula ou vazia', () => {
    expect(formatRankingDate(null)).toBeNull();
    expect(formatRankingDate(undefined)).toBeNull();
    expect(formatRankingDate('')).toBeNull();
  });
});

describe('formatRankings', () => {
  it('formata ranking com data de aferição quando presente', () => {
    const rankings = {
      CBT: {
        position: 114,
        category: '16 anos',
        rankingDate: '2026-11-17',
      },
    };

    const formatted = formatRankings(rankings);
    expect(formatted).toEqual(['CBT #114 (16 anos) em 17 nov 26']);
  });

  it('formata ranking sem data mantendo o padrão anterior', () => {
    const rankings = {
      CBT: {
        position: 5,
        category: '17-18',
      },
    };

    const formatted = formatRankings(rankings);
    expect(formatted).toEqual(['CBT #5 (17-18)']);
  });

  it('retorna null para rankings vazios ou nulos', () => {
    expect(formatRankings(null)).toBeNull();
    expect(formatRankings({})).toBeNull();
  });
});
