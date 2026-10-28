import { jwtVerify } from 'jose';

// NOTE: The secret is cached at module load time. If JWT_SECRET is rotated,
// the running process must be restarted to pick up the new value.
let secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array | null {
  if (secretKey) return secretKey;
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) return null;
  secretKey = new TextEncoder().encode(JWT_SECRET);
  return secretKey;
}

export async function decodeJwtPayload(
  token: string,
): Promise<{ sub: string; role: string; sv?: number; mcp?: boolean; pp?: string | null; mk?: string | null } | null> {
  if (!token || typeof token !== 'string') return null;
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const sub = payload.sub;
    const role = payload.role as string | undefined;
    if (!sub || !role) return null;
    const sv = typeof payload.sv === 'number' ? payload.sv : undefined;
    const mcp = typeof payload.mcp === 'boolean' ? payload.mcp : undefined;
    const pp = typeof payload.pp === 'string' ? payload.pp : null;
    const mk = typeof payload.mk === 'string' ? payload.mk : null;
    return sv === undefined && mcp === undefined && pp === null && mk === null ? { sub, role } : sv === undefined && mcp === undefined && pp === null ? { sub, role, mk } : sv === undefined && mcp === undefined && mk === null ? { sub, role, pp } : sv === undefined && mcp === undefined ? { sub, role, pp, mk } : sv === undefined && pp === null && mk === null ? { sub, role, mcp } : sv === undefined && pp === null ? { sub, role, mcp, mk } : sv === undefined && mk === null ? { sub, role, mcp, pp } : mcp === undefined && pp === null && mk === null ? { sub, role, sv } : mcp === undefined && pp === null ? { sub, role, sv, mk } : mcp === undefined && mk === null ? { sub, role, sv, pp } : pp === null && mk === null ? { sub, role, sv, mcp } : { sub, role, sv, mcp, pp, mk };
  } catch {
    return null;
  }
}

export function isTokenExpired(
  token: string,
  skewSeconds = 0,
): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(json);
    if (typeof payload.exp !== 'number') return false;
    const now = Math.floor(Date.now() / 1000);
    return now > payload.exp - skewSeconds;
  } catch {
    return false;
  }
}