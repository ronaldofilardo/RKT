import { generateSpectateToken, hashSpectateToken } from '../spectate-token';

describe('spectate-token', () => {
  it('gera token de 32 bytes em base64url e seu hash SHA-256', () => {
    const { token, tokenHash } = generateSpectateToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(tokenHash).toBe(hashSpectateToken(token));
  });

  it('hashSpectateToken é determinístico e suporta trimming', () => {
    const raw = 'test-token-123';
    const hash1 = hashSpectateToken(raw);
    const hash2 = hashSpectateToken(`  ${raw}  `);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex tem 64 chars
  });
});

