import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/schemas/contracts';
import { runWithRLS, getRLSUser, type RLSUser } from './rls-context';
import { decodeJwtPayload } from './jwt-client';

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 2,
  ANNOTATOR: 1,
};

const VALID_ROLES = new Set<Role>(['ADMIN', 'ANNOTATOR']);

function isRole(value: string): value is Role {
  return VALID_ROLES.has(value as Role);
}

async function extractUserFromHeaders(request: NextRequest): Promise<RLSUser | null> {
  const id = request.headers.get('x-user-id');
  const rawRole = request.headers.get('x-user-role');
  if (!id || !rawRole || !isRole(rawRole)) return null;
  return { id, role: rawRole };
}

async function extractUserFromJwt(request: NextRequest): Promise<RLSUser | null> {
  const authHeader = request.headers.get('authorization');
  const rawBearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const bearerToken =
    rawBearer && rawBearer !== 'null' && rawBearer !== 'undefined' ? rawBearer : null;
  const cookieToken =
    request.cookies.get('rkt_access_token')?.value ??
    request.cookies.get('access_token')?.value ??
    null;
  const token = bearerToken ?? cookieToken ?? null;
  if (!token) return null;
  const payload = await decodeJwtPayload(token);
  if (!payload) return null;
  if (!isRole(payload.role)) return null;
  return { id: payload.sub, role: payload.role };
}

export async function getUserFromRequestScoped(
  request: NextRequest,
): Promise<RLSUser | null> {
  const fromHeaders = await extractUserFromHeaders(request);
  if (fromHeaders) return fromHeaders;
  return extractUserFromJwt(request);
}

export async function getUserFromRequest(request: NextRequest): Promise<RLSUser | null> {
  return getUserFromRequestScoped(request);
}

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
  handler: () => Promise<T>,
): Promise<Response | T> {
  const roleCheck = await requireRole(request, minRole);
  if (roleCheck) return roleCheck;

  const user = (await getUserFromRequestScoped(request))!;
  return runWithRLS(user, handler);
}

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
  handler: () => Promise<T>,
): Promise<Response | T> {
  const permCheck = await requirePermission(request, action);
  if (permCheck) return permCheck;

  const user = (await getUserFromRequestScoped(request))!;
  return runWithRLS(user, handler);
}

export { getRLSUser };

