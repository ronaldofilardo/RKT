import { createHash } from 'crypto';

export const CURRENT_TERMS_VERSION = '2.0';
export const GUARDIAN_TERMS_VERSION = '2.0';

/**
 * Calcula o hash SHA-256 do texto de termos exibido para fins de prova jurídica de consentimento.
 */
export function computeTermsContentHash(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex');
}
