import { SignJWT, jwtVerify } from 'jose';

/**
 * JWT_SECRET compartilhado — fallback ao "test-secret" quando `.env.test`
 * não fornecer (compat com suites pré-existentes).
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'test-secret',
);

/**
 * Gera um JWT válido assinado (caminho via `getUserFromRequestScoped`).
 * Use quando o teste quiser validar o fluxo JWT real (não via headers).
 *
 * @example
 *   const token = await createToken('user-123', 'ATHLETE');
 *   const req = new NextRequest(url, { headers: { authorization: `Bearer ${token}` } });
 */
export async function createToken(
  userId: string,
  role: string,
): Promise<string> {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

/**
 * Configura o mock de `jwtVerify` (de `jose`) para retornar um payload
 * específico. Use no `beforeEach` das suites de API.
 *
 * @example
 *   mockJwtVerify({ sub: 'admin-1', role: 'ADMIN' });
 *   // ou para simular rejeição:
 *   mockJwtVerify(new Error('Invalid token'));
 *
 * @requires `jest.mock('jose', () => ({ jwtVerify: jest.fn() }))` no topo do arquivo.
 */
export function mockJwtVerify(
  payload: { sub: string; role: string; [k: string]: unknown } | Error,
): void {
  const mocked = jwtVerify as unknown as jest.Mock;
  if (payload instanceof Error) {
    mocked.mockRejectedValue(payload);
  } else {
    mocked.mockResolvedValue({ payload } as any);
  }
}
