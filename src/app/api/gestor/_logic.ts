import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor } from '@/services/accessService';
import { NextResponse } from 'next/server';

export async function getGestorCtIds(request: Request | any): Promise<string[]> {
  const req = request as any;
  const user = await getAccessUserFromRequest(req);
  if (!user) return [];

  const actor = await getActor(user.id);
  if (!actor || !actor.isActive) return [];

  return actor.memberships
    .filter((m: any) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && !!m.ctId)
    .map((m: any) => m.ctId as string);
}

export async function getGestorCtId(request: Request | any): Promise<string | null> {
  const ids = await getGestorCtIds(request);
  return ids[0] ?? null;
}

export function denyGestor(message: string): NextResponse {
  return NextResponse.json({ error: 'FORBIDDEN', message }, { status: 403 });
}
