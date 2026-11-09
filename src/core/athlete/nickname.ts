/**
 * Validação pura do apelido público do atleta (nickname).
 *
 * O nickname é escolhido pelo atleta, legível e único globalmente — distinto
 * do `athleteCode` (gerado pelo sistema, opaco). Sempre persistido normalizado.
 */
export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 30;
export const NICKNAME_REGEX = /^[a-z0-9._-]+$/;

export type NicknameInvalidReason = 'muito_curto' | 'muito_longo' | 'caracteres_invalidos';

export interface NicknameValidation {
  valid: boolean;
  reason?: NicknameInvalidReason;
}

/** Normaliza para comparação/persistência: trim + minúsculas. */
export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateNickname(raw: string): NicknameValidation {
  const value = normalizeNickname(raw);
  if (value.length < NICKNAME_MIN) return { valid: false, reason: 'muito_curto' };
  if (value.length > NICKNAME_MAX) return { valid: false, reason: 'muito_longo' };
  if (!NICKNAME_REGEX.test(value)) return { valid: false, reason: 'caracteres_invalidos' };
  return { valid: true };
}
