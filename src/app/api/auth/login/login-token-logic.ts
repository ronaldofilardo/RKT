import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

export async function generateLoginToken(
  userId: string,
  role: string,
  sv?: number,
  mustChangePassword?: boolean,
  platformPreset?: string | null,
  membershipKind?: string | null,
): Promise<string> {
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment');
  }
  return new SignJWT({
    sub: userId,
    role,
    ...(sv !== undefined ? { sv } : {}),
    ...(mustChangePassword !== undefined ? { mcp: !!mustChangePassword } : {}),
    ...(platformPreset !== undefined ? { pp: platformPreset } : {}),
    ...(membershipKind !== undefined ? { mk: membershipKind } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);
}
