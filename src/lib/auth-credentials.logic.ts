import { NextRequest } from 'next/server';
import type { Role } from '@/schemas/contracts';
import type { RLSUser } from './rls-context';
import { decodeJwtPayload } from './jwt-client';
import { isSessionCurrent } from './session-version.logic';

export const VALID_ROLES = new Set<Role>(['ADMIN', 'ANNOTATOR']);

export function isRole(value: string): value is Role {
  return VALID_ROLES.has(value as Role);
}

type Accept = (role: string) => boolean;
interface Found {
  user: RLSUser;
  sv?: number;
}

function parseSv(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function fromHeaders(request: NextRequest, accept: Accept): Found | null {
  const id = request.headers.get('x-user-id');
  const rawRole = request.headers.get('x-user-role');
  if (!id || !rawRole || !accept(rawRole)) return null;
  return { user: { id, role: rawRole }, sv: parseSv(request.headers.get('x-user-sv')) };
}

async function fromJwt(request: NextRequest, accept: Accept): Promise<Found | null> {
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
  if (!payload || !accept(payload.role)) return null;
  return { user: { id: payload.sub, role: payload.role }, sv: payload.sv };
}

async function resolveUser(request: NextRequest, accept: Accept): Promise<RLSUser | null> {
  const found = fromHeaders(request, accept) ?? (await fromJwt(request, accept));
  if (!found) return null;
  return (await isSessionCurrent(found.user.id, found.sv)) ? found.user : null;
}

/** Guarda legado: só roles ADMIN|ANNOTATOR; confere também a versão de sessão (`sv`). */
export async function getUserFromRequestScoped(
  request: NextRequest,
): Promise<RLSUser | null> {
  return resolveUser(request, isRole);
}

/** Extrator das rotas novas (§6.4): aceita qualquer role não vazia, ex.: `NONE`. */
export async function getAccessUserFromRequest(
  request: NextRequest,
): Promise<RLSUser | null> {
  return resolveUser(request, (role) => role.length > 0);
}

export async function getUserFromRequest(request: NextRequest): Promise<RLSUser | null> {
  return getUserFromRequestScoped(request);
}
