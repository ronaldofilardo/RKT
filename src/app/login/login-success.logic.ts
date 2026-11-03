import { writeToSessionOnly } from '@/lib/auth-client';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { homeForProfileString } from '@/core/access/home';
import { homeForArea, AreaCode } from '@/core/access/areas';
import { isAreaUrlsEnabled } from '@/lib/feature-flags';
import { sanitizeNextRedirect } from '@/core/access/safe-redirect.logic';
import type { LoginResponse } from '@/lib/auth-client-login';

export async function processLoginSuccess(
  data: LoginResponse,
  searchParams: URLSearchParams,
  pushRoute: (url: string) => void,
): Promise<void> {
  const effectiveProfile = (data.user as any).profile ?? data.user.role;
  let jwtPlatformPreset: string | null = null;
  let activeArea: AreaCode | null = null;
  let availableAreas: string[] = [];

  if (data.accessToken) {
    const decoded = await decodeJwtPayload(data.accessToken);
    jwtPlatformPreset = decoded?.pp ?? null;
    activeArea = (decoded?.ax as AreaCode) ?? null;
    availableAreas = decoded?.ars ?? [];
  }
  const finalProfile = jwtPlatformPreset ?? effectiveProfile;

  writeToSessionOnly({
    userId: data.user.id,
    userRole: finalProfile,
    userName: data.user.name,
  });

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (typeof document !== 'undefined') {
    document.cookie = `user_role=${finalProfile}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }

  if (data.user.mustChangePassword) {
    pushRoute('/trocar-senha');
    return;
  }

  const rawNext = searchParams.get('next');
  const defaultHome = isAreaUrlsEnabled() && activeArea
    ? homeForArea(activeArea)
    : homeForProfileString(finalProfile);

  if (rawNext) {
    const candidate = sanitizeNextRedirect(rawNext, defaultHome);
    if (candidate.startsWith('/suporte') && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN') {
      pushRoute(defaultHome);
    } else if (candidate.startsWith('/admin') && activeArea !== 'ADMIN') {
      pushRoute(defaultHome);
    } else if (candidate.startsWith('/gestor') && activeArea !== 'GESTOR' && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN') {
      pushRoute(defaultHome);
    } else {
      pushRoute(candidate);
    }
  } else if (isAreaUrlsEnabled() && availableAreas.length > 1) {
    pushRoute('/escolher-area');
  } else {
    pushRoute(defaultHome);
  }
}
