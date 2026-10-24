import { NextRequest } from 'next/server';
import type { Role } from '@/schemas/contracts';
import type { RLSUser } from './rls-context';
import { decodeJwtPayload } from './jwt-client';

export const VALID_ROLES = new Set<Role>(['ADMIN', 'ANNOTATOR']);

export function isRole(value: string): value is Role {
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
