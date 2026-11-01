import { writeToSessionOnly } from '@/lib/auth-client';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { homeForProfileString } from '@/core/access/home';
import type { LoginResponse } from '@/lib/auth-client-login';

export async function processLoginSuccess(
  data: LoginResponse,
  searchParams: URLSearchParams,
  pushRoute: (url: string) => void,
): Promise<void> {
  const effectiveProfile = (data.user as any).profile ?? data.user.role;
  let jwtPlatformPreset: string | null = null;
  if (data.accessToken) {
    const decoded = await decodeJwtPayload(data.accessToken);
    jwtPlatformPreset = decoded?.pp ?? null;
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
  } else {
    const rawNext = searchParams.get('next');
    const isSafeNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//');
    pushRoute(isSafeNext ? rawNext : homeForProfileString(finalProfile));
  }
}

