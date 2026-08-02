const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('[jwt] JWT_SECRET is not defined in environment');
}

const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

export async function getJWTSecret(): Promise<Uint8Array> {
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment');
  }
  return secretKey;
}

export async function invalidateJWTSecret(): Promise<void> {
  // no-op — secret is loaded from env at startup
}