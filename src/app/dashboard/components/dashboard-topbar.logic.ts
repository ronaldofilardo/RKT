import { homeForArea, type AreaCode } from '@/core/access/areas';

export function resolveUserEffectiveArea(userRole?: string | null): string | null {
  if (typeof window !== 'undefined') {
    const activeArea = sessionStorage.getItem('active_area');
    if (activeArea) return activeArea;
    const sessionRole = sessionStorage.getItem('user_role');
    if (sessionRole) return sessionRole;
  }
  return userRole ?? null;
}

export function isAreaExcludedFromBack(effectiveArea: string | null): boolean {
  if (!effectiveArea) return false;
  return effectiveArea === 'ADMIN' || effectiveArea === 'SUPORTE' || effectiveArea === 'GESTOR';
}

export function resolveHomeHref(effectiveArea: string | null): string {
  if (!effectiveArea) return '/dashboard';
  try {
    return homeForArea(effectiveArea as AreaCode);
  } catch {
    return '/dashboard';
  }
}
