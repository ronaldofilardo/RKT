import type { NextResponse } from 'next/server';
import type { SessionContextOption } from './login-contexts.logic';

// Área efetiva do contexto escolhido no login (usada no claim JWT `ax`).
export function resolveLoginArea(chosenContext: SessionContextOption | undefined): string | undefined {
  if (!chosenContext) return undefined;
  if (chosenContext.type === 'PARTICULAR') return 'TREINADOR_AVULSO';
  if (chosenContext.type === 'CT') {
    if (chosenContext.role === 'GESTOR') return 'GESTOR';
    if (chosenContext.role === 'TREINADOR') return 'TREINADOR_CLUBE';
  }
  return undefined;
}

// Cookies de sessão: `rkt_access_token` httpOnly e `access_token` legível pelo
// front; sem maxAge quando o usuário ainda precisa trocar a senha.
export function applyLoginCookies(
  response: NextResponse,
  accessToken: string,
  mustChangePassword: boolean,
): void {
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(mustChangePassword ? {} : { maxAge: 60 * 60 * 2 }),
  };
  response.cookies.set('rkt_access_token', accessToken, cookieOpts);
  response.cookies.set('access_token', accessToken, {
    ...cookieOpts,
    httpOnly: false,
  });
}
