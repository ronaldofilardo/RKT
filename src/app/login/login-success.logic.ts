import { writeToSessionOnly } from '@/lib/auth-client';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { homeForProfileString } from '@/core/access/home';
import { homeForArea, type AreaCode } from '@/core/access/areas';
import { isAreaUrlsEnabled } from '@/lib/feature-flags';
import { sanitizeNextRedirect } from '@/core/access/safe-redirect.logic';
import type { LoginResponse } from '@/lib/auth-client-login';
import { isOnboarded, onboardingProfileFor, onboardingProfileForArea } from '@/lib/onboarding';

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
    accessToken: data.accessToken,
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
  const inferredArea = data.availableAreas?.find((area) => onboardingProfileForArea(area.code))?.code as AreaCode | undefined;
  const resolvedArea = activeArea ?? inferredArea ?? null;
  const defaultHome = isAreaUrlsEnabled() && resolvedArea
    ? homeForArea(resolvedArea)
    : homeForProfileString(finalProfile);

  let destination = defaultHome;
  if (rawNext) {
    const candidate = sanitizeNextRedirect(rawNext, defaultHome);
    const blocked =
      (candidate.startsWith('/suporte') && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN') ||
      (candidate.startsWith('/admin') && activeArea !== 'ADMIN') ||
      (candidate.startsWith('/gestor') && activeArea !== 'GESTOR' && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN');
    destination = blocked ? defaultHome : candidate;
  } else if (isAreaUrlsEnabled() && availableAreas.length > 1) {
    destination = '/escolher-area';
  }

  const onboardingProfile = onboardingProfileFor(resolvedArea, finalProfile);
  if (onboardingProfile && !isOnboarded(data.user.id)) {
    const query = new URLSearchParams({ next: destination, perfil: onboardingProfile });
    pushRoute(`/onboarding?${query.toString()}`);
    return;
  }

  pushRoute(destination);
}
