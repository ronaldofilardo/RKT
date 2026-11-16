export const ADULT_AGE = 18;

/**
 * Menor de idade, avaliado na leitura (sem cron). Sem data de nascimento
 * ou data inválida → tratado como menor, para fins de proteção (§10.1).
 */
export function isMinor(birthDate: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!birthDate) return true;
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (Number.isNaN(d.getTime())) return true;
  const adultOn = Date.UTC(
    d.getUTCFullYear() + ADULT_AGE,
    d.getUTCMonth(),
    d.getUTCDate(),
  );
  return now.getTime() < adultOn;
}

export interface GuardianLinkState {
  confirmedAt?: Date | null;
  revokedAt?: Date | null;
}

/**
 * Vínculo de responsável com acesso ativo: confirmado, não revogado e o
 * atleta ainda é menor. Ao completar 18 anos o vínculo fica dormente (§10.5).
 */
export function guardianLinkActive(
  link: GuardianLinkState,
  playerBirthDate: Date | null | undefined,
  now: Date,
): boolean {
  if (!link.confirmedAt || link.revokedAt) return false;
  return isMinor(playerBirthDate, now);
}
