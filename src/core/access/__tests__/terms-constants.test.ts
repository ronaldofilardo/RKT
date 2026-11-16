import {
  CURRENT_TERMS_VERSION,
  GUARDIAN_TERMS_VERSION,
  computeTermsContentHash,
} from '../terms-constants';

describe('terms-constants', () => {
  it('define CURRENT_TERMS_VERSION e GUARDIAN_TERMS_VERSION como 2.0', () => {
    expect(CURRENT_TERMS_VERSION).toBe('2.0');
    expect(GUARDIAN_TERMS_VERSION).toBe('2.0');
  });

  it('calcula o hash SHA-256 de forma determinística ignorando espaços nas bordas', () => {
    const text = 'Termo de consentimento v2.0';
    const hash1 = computeTermsContentHash(text);
    const hash2 = computeTermsContentHash(`  ${text}  `);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).toBe(hash2);
  });
});
