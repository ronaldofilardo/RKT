import { NextResponse } from 'next/server';
import { EndSessionInputSchema } from '@/schemas/contracts';
import type { z } from 'zod';
import { getSessionWithMatch, getMatchScoreState, updateSession } from '@/services/sessionService';
import { buildSessionUpdateData, isValidSessionStatus } from './route.helpers';

type Session = Awaited<ReturnType<typeof getSessionWithMatch>>;
type EndSessionInput = z.infer<typeof EndSessionInputSchema>;

function getSessionAccessError(
  session: Session,
  matchId: string,
  user: { id: string; role: string },
): Response | null {
  if (!session || session.matchId !== matchId) {
    return NextResponse.json({ error: 'SESSION_NOT_FOUND' }, { status: 404 });
  }
  if (session.annotatorUserId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Only the annotator or admin can end a session' },
      { status: 403 },
    );
  }
  if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
    return NextResponse.json({ id: session.id, status: session.status, alreadyEnded: true });
  }
  return null;
}

async function parseSessionInput(request: Request): Promise<{ input: EndSessionInput; status: string } | Response> {
  const body = await request.json().catch(() => ({}));
  const parsed = EndSessionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.errors },
      { status: 400 },
    );
  }
  const newStatus = parsed.data.status || 'COMPLETED';
  if (!isValidSessionStatus(newStatus)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }
  return { input: parsed.data, status: newStatus };
}

export async function executeSessionPatch(
  request: Request,
  matchId: string,
  sessionId: string,
  user: { id: string; role: string },
): Promise<Response> {
  const session = await getSessionWithMatch(sessionId, matchId);
  const accessError = getSessionAccessError(session, matchId, user);
  if (accessError) return accessError;

  const parsedInput = await parseSessionInput(request);
  if (parsedInput instanceof Response) return parsedInput;

  const match = await getMatchScoreState(matchId);
  const updateData = buildSessionUpdateData(parsedInput.status, parsedInput.input, match?.scoreState);
  const updated = await updateSession(sessionId, updateData as Parameters<typeof updateSession>[1]);
  return NextResponse.json(updated);
}
