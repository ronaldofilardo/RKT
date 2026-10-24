import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/schemas/contracts';
import { runWithRLS, type RLSUser } from './rls-context';
import { getUserFromRequestScoped, isRole } from './auth-credentials.logic';

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 2,
  ANNOTATOR: 1,
};

export async function requireRole(request: NextRequest, minRole: Role): Promise<NextResponse | null> {
  const user = await getUserFromRequestScoped(request);
  if (!user) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Token de acesso requerido' },
      { status: 401 },
    );
  }

  if (!isRole(user.role) || ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: `Requer role ${minRole}. Role atual: ${user.role}`,
      },
      { status: 403 },
    );
  }

  return null;
}

export async function withRLSHandler<T extends Response = NextResponse>(
  request: NextRequest,
  minRole: Role,
  handler: (user: RLSUser) => Promise<T>,
): Promise<Response | T> {
  const roleCheck = await requireRole(request, minRole);
  if (roleCheck) return roleCheck;

  const user = (await getUserFromRequestScoped(request))!;
  return runWithRLS(user, () => handler(user));
}
