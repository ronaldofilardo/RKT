import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function getAuthToken(request: Pick<NextRequest, 'headers' | 'cookies'>) {
  const authHeader = request.headers.get('authorization');
  let bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (bearerToken === 'null' || bearerToken === 'undefined') {
    bearerToken = null;
  }
  return (
    bearerToken ??
    request.cookies.get('rkt_access_token')?.value ??
    request.cookies.get('access_token')?.value ??
    null
  );
}

// Fase 5: Verificação de Origem contra CSRF em Mutações de API
export function enforceOriginCheck(request: NextRequest): NextResponse | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || !request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  let sourceUrl: URL | null = null;
  try {
    if (origin) sourceUrl = new URL(origin);
    else if (referer) sourceUrl = new URL(referer);
  } catch {
    // ste-exception R-08: `new URL` lança sobre Origin/Referer malformados.
    // Comportamento desejado: sourceUrl fica null e a checagem CSRs segue.
  }

  // Ambiente de testes locais (Jest) ou chamadas servidor-servidor que não enviam origin/referer
  // podem precisar de bypass, mas browsers sempre enviam.
  if (process.env.NODE_ENV !== 'test') {
    if (!sourceUrl || sourceUrl.host !== host) {
      return NextResponse.json(
        { error: 'CSRF_VIOLATION', message: 'Origem da requisição não permitida' },
        { status: 403 }
      );
    }
  }
  return null;
}
