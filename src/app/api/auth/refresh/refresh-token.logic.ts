import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

export interface RefreshTokenPayload {
  sub: string;
  role: string;
  sv?: number;
  mcp?: boolean;
  pp?: string | null;
  mk?: string | null;
  cx?: string | null;
  ax?: string | null;
  ct?: string | null;
  ars?: string[];
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  if (!secretKey) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const sub = payload.sub;
    const role = payload.role as string | undefined;
    if (!sub || !role) return null;

    const result: RefreshTokenPayload = { sub, role };
    if (typeof payload.sv === 'number') result.sv = payload.sv;
    if (typeof payload.mcp === 'boolean') result.mcp = payload.mcp;
    if (typeof payload.pp === 'string') result.pp = payload.pp;
    if (typeof payload.mk === 'string') result.mk = payload.mk;
    if (typeof payload.cx === 'string') result.cx = payload.cx;
    if (typeof payload.ax === 'string') result.ax = payload.ax;
    if (typeof payload.ct === 'string') result.ct = payload.ct;
    if (Array.isArray(payload.ars)) result.ars = payload.ars.filter((x): x is string => typeof x === 'string');

    return result;
  } catch {
    return null;
  }
}

export async function generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment');
  }

  const claims: Record<string, unknown> = {
    sub: payload.sub,
    role: payload.role,
  };
  if (payload.sv !== undefined) claims.sv = payload.sv;
  if (payload.mcp !== undefined) claims.mcp = payload.mcp;
  if (payload.pp !== undefined && payload.pp !== null) claims.pp = payload.pp;
  if (payload.mk !== undefined && payload.mk !== null) claims.mk = payload.mk;
  if (payload.cx !== undefined && payload.cx !== null) claims.cx = payload.cx;
  if (payload.ax !== undefined && payload.ax !== null) claims.ax = payload.ax;
  if (payload.ct !== undefined && payload.ct !== null) claims.ct = payload.ct;
  if (payload.ars && payload.ars.length > 0) claims.ars = payload.ars;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);
}

