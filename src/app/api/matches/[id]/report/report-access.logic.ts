import { NextResponse } from 'next/server';
import { can, canReadMatch, type Actor, type MatchAccess } from '@/core/access';

/**
 * Guards de acesso do relatório: 404 inexistente, 410 cancelada e 403
 * sem vínculo de leitura autorizado.
 * Retorna `null` quando o acesso é permitido.
 */
export function checkReportAccess(
  actor: Actor | null,
  match: { state: string } | null,
  matchAccess: MatchAccess | null,
): NextResponse | null {
  if (!match) {
    return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
  }

  if (match.state === 'CANCELLED') {
    return NextResponse.json(
      { error: 'MATCH_CANCELLED', message: 'Partida cancelada ou removida' },
      { status: 410 },
    );
  }

  if (!matchAccess) {
    return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
  }

  if (!can(actor, 'report:view').allow || !canReadMatch(actor, matchAccess)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  return null;
}
