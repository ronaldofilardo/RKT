import { createHash, timingSafeEqual } from 'crypto';

/**
 * Compara dois tokens contra timing attacks usando SHA-256 e timingSafeEqual.
 */
export function safeCompareTokens(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashProvided = createHash('sha256').update(provided).digest();
  const hashExpected = createHash('sha256').update(expected).digest();
  return timingSafeEqual(hashProvided, hashExpected);
}
