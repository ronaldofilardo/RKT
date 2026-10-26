import { guardianLinkActive, isMinor } from '../age';

const NOW = new Date('2026-10-25T12:00:00Z');

describe('isMinor', () => {
  it('17 anos e 364 dias ainda é menor; no aniversário de 18 é adulto', () => {
    expect(isMinor(new Date('2008-10-26T00:00:00Z'), NOW)).toBe(true);
    expect(isMinor(new Date('2008-10-25T00:00:00Z'), NOW)).toBe(false);
  });

  it('adulto', () => {
    expect(isMinor(new Date('1990-01-01T00:00:00Z'), NOW)).toBe(false);
  });

  it('sem data ou data inválida → menor (proteção)', () => {
    expect(isMinor(null, NOW)).toBe(true);
    expect(isMinor(undefined, NOW)).toBe(true);
    expect(isMinor(new Date('invalid'), NOW)).toBe(true);
  });
});

describe('guardianLinkActive', () => {
  const minor = new Date('2015-05-05T00:00:00Z');
  const adult = new Date('1990-05-05T00:00:00Z');
  const confirmed = new Date('2026-01-01T00:00:00Z');

  it('ativo: confirmado, não revogado e menor', () => {
    expect(guardianLinkActive({ confirmedAt: confirmed }, minor, NOW)).toBe(true);
  });

  it('inativo: não confirmado, revogado ou atleta já maior (dormente)', () => {
    expect(guardianLinkActive({}, minor, NOW)).toBe(false);
    expect(guardianLinkActive({ confirmedAt: confirmed, revokedAt: confirmed }, minor, NOW)).toBe(false);
    expect(guardianLinkActive({ confirmedAt: confirmed }, adult, NOW)).toBe(false);
  });
});
