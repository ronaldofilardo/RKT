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
): Promise<{ sub: string; role: string } | null> {
  if (!token || typeof token !== 'string') return null;
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const sub = payload.sub;
    const role = payload.role as string | undefined;
    if (!sub || !role) return null;
    return { sub, role };
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