export type OnboardingProfile = 'ATLETA' | 'TREINADOR' | 'GESTOR' | 'ESPECTADOR';

const STORAGE_PREFIX = 'rkt_onboarded_';

const ROLE_PROFILES: Record<string, OnboardingProfile> = {
  ATLETA: 'ATLETA',
  ATHLETE: 'ATLETA',
  TREINADOR: 'TREINADOR',
  COACH: 'TREINADOR',
  GESTOR: 'GESTOR',
  MANAGER: 'GESTOR',
  ESPECTADOR: 'ESPECTADOR',
  SPECTATOR: 'ESPECTADOR',
};

export function onboardingStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Sem `window` (SSR) considera concluído para nunca bloquear navegação no servidor. */
export function isOnboarded(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(onboardingStorageKey(userId)) === '1';
  } catch {
    return true;
  }
}

export function markOnboarded(userId: string): void {
  try {
    window.localStorage.setItem(onboardingStorageKey(userId), '1');
  } catch {
    // Armazenamento indisponível: o usuário apenas verá a introdução novamente.
  }
}

export function onboardingProfileForArea(area?: string | null): OnboardingProfile | null {
  if (area === 'ATLETA') return 'ATLETA';
  if (area === 'TREINADOR_CLUBE' || area === 'TREINADOR_AVULSO') return 'TREINADOR';
  if (area === 'GESTOR') return 'GESTOR';
  if (area === 'ESPECTADOR') return 'ESPECTADOR';
  return null;
}

export function onboardingProfileForRole(role?: string | null): OnboardingProfile | null {
  if (!role) return null;
  return ROLE_PROFILES[role.toUpperCase()] ?? null;
}

/** Prefere a área ativa (ax) e recorre ao perfil do usuário quando ainda não há área escolhida. */
export function onboardingProfileFor(
  area?: string | null,
  role?: string | null,
): OnboardingProfile | null {
  return onboardingProfileForArea(area) ?? onboardingProfileForRole(role);
}
