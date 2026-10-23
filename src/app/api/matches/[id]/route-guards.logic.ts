import { NextResponse } from 'next/server';
import type { RLSUser } from '@/lib/rls-context';

/**
 * Guard comum das rotas /api/matches/[id]: contexto RLS ausente → 401;
 * papel ADMIN → 403 (admins não acessam partidas de anotadores).
 * Retorna `null` quando o contexto é válido.
 */
export function annotatorContextGuard(user: RLSUser | null): NextResponse | null {
  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Contexto RLS ausente' },
      { status: 401 }
    );
  }

  if (user.role === 'ADMIN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Administradores não têm acesso às partidas de anotadores' },
      { status: 403 }
    );
  }

  return null;
}
