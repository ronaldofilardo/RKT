import { NextRequest, NextResponse } from 'next/server';
import { getRLSUser } from '@/lib/auth';
import { MarkSessionAbandonedInputSchema } from '@/schemas/contracts';
import { getSessionWithMatch, getMatchScoreState, updateSession } from '@/services/sessionService';

type Session = NonNullable<Awaited<ReturnType<typeof getSessionWithMatch>>>;
type User = NonNullable<ReturnType<typeof getRLSUser>>;

export function isSessionOwnerOrAdmin(session: Session, user: User): boolean {
  return session.annotatorUserId === user.id || user.role === 'ADMIN';
}

export function isSessionEnded(status: string): boolean {
  return status === 'COMPLETED' || status === 'ABANDONED';
}

export function getMatchStateSnapshot(requestedSnapshot: string | undefined, scoreState: unknown): string | null | undefined {
  if (requestedSnapshot) return requestedSnapshot;
  if (!scoreState) return requestedSnapshot;
  return typeof scoreState === 'string' ? scoreState : JSON.stringify(scoreState);
}

export async function executeAbandonSession(request: NextRequest, matchId: string, sessionId: string): Promise<NextResponse> {
  const user = getRLSUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const session = await getSessionWithMatch(sessionId, matchId);
  if (!session || session.matchId !== matchId) return NextResponse.json({ error: 'SESSION_NOT_FOUND' }, { status: 404 });
  if (!isSessionOwnerOrAdmin(session, user)) return NextResponse.json({ error: 'FORBIDDEN', message: 'Only the annotator or admin can abandon a session' }, { status: 403 });
  if (isSessionEnded(session.status)) return NextResponse.json({ message: 'Session already ended', id: session.id, status: session.status });
  const parsed = MarkSessionAbandonedInputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.errors }, { status: 400 });
  const match = await getMatchScoreState(matchId);
  const matchStateSnapshot = getMatchStateSnapshot(parsed.data.matchStateSnapshot, match?.scoreState);
  const updated = await updateSession(sessionId, { status: 'ABANDONED', isActive: false, matchStateSnapshot: matchStateSnapshot ?? null });
  return NextResponse.json(updated);
}
