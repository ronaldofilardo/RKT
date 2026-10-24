import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/schemas/contracts';
import { runWithRLS, type RLSUser } from './rls-context';
import { getUserFromRequestScoped, isRole } from './auth-credentials.logic';

export type AppAction =
  | 'manage:users'
  | 'manage:clubs'
  | 'view:all_matches'
  | 'score:match'
  | 'view:tactical_stats'
  | 'annotate:session'
  | 'play:match'
  | 'view:own_stats'
  | 'view:public_matches';

export const ROLE_PERMISSIONS: Record<Role, readonly AppAction[]> = {
  ADMIN: [
    'manage:users',
    'manage:clubs',
  ],
  ANNOTATOR: [
    'score:match',
    'annotate:session',
    'play:match',
    'view:own_stats',
    'view:public_matches',
    'view:tactical_stats',
  ],
};

export function hasPermission(role: Role, action: AppAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions?.includes(action));
}

export async function requirePermission(
  request: NextRequest,
  action: AppAction,
): Promise<NextResponse | null> {
  const user = await getUserFromRequestScoped(request);
  if (!user) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Token de acesso requerido' },
      { status: 401 },
    );
  }

  if (!isRole(user.role) || !hasPermission(user.role, action)) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: `Ação não permitida para a role ${user.role}. Requer permissão: ${action}`,
      },
      { status: 403 },
    );
  }

  return null;
}

export async function withPermissionHandler<T extends Response = NextResponse>(
  request: NextRequest,
  action: AppAction,
  handler: (user: RLSUser) => Promise<T>,
): Promise<Response | T> {
  const permCheck = await requirePermission(request, action);
  if (permCheck) return permCheck;

  const user = (await getUserFromRequestScoped(request))!;
  return runWithRLS(user, () => handler(user));
}
