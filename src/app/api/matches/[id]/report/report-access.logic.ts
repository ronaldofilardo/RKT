import { NextResponse } from 'next/server';
import type { getRLSUser } from '@/lib/auth';
import type { getMatch } from '@/services/matchService';

type ReportRLSUser = NonNullable<Awaited<ReturnType<typeof getRLSUser>>>;
type MatchForReport = NonNullable<Awaited<ReturnType<typeof getMatch>>>;

/**
 * Guards de acesso do relatório: 401 sem usuário, 404 inexistente,
 * 410 cancelada e 403 sem permissão (jogador, criador ou ADMIN).
 * Retorna `null` quando o acesso é permitido.
 */
export function checkReportAccess(
  user: ReportRLSUser | null,
  match: MatchForReport | null,
): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!match) {
    return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
  }

  if (match.state === 'CANCELLED') {
    return NextResponse.json(
      { error: 'MATCH_CANCELLED', message: 'Partida cancelada ou removida' },
      { status: 410 },
    );
  }

  const isStaff = user.role === 'ADMIN';
  const isPlayer =
    match.player1.id === user.id ||
    match.player2.id === user.id ||
    match.player1PartnerId === user.id ||
    match.player2PartnerId === user.id;
  const isCreator = match.createdByUserId === user.id;
  if (!isPlayer && !isCreator && !isStaff) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  return null;
}
