/**
 * Helpers de autenticação para testes de API routes.
 *
 * Sprint 1.3 do plano de elevação de qualidade. Elimina duplicação de
 * `createToken`/`JWT_SECRET`/`makeAuthHeaders` repetidos em ~12 suites de API.
 *
 * Padrão recomendado de uso (ver TD-029):
 *
 *   jest.mock('@/lib/prisma', () => ({ /* ... *\/ }));
 *   jest.mock('jose', () => ({ jwtVerify: jest.fn() }));  // não mockar @/lib/auth
 *
 *   import { makeAuthHeaders, mockJwtVerify } from '@/tests/helpers/auth';
 *
 *   beforeEach(() => {
 *     jest.clearAllMocks();
 *     mockJwtVerify({ sub: 'user-123', role: 'ATHLETE' });
 *   });
 *
 *   const req = new NextRequest('http://localhost/api/...', {
 *     headers: makeAuthHeaders('user-123', 'ATHLETE'),
 *   });
 *
 * Quando preferir caminho do middleware: passar `x-user-id`/`x-user-role`
 * diretamente via `makeAuthHeaders`. Quando preferir caminho do JWT (mínimo):
 * usar `createToken` (gera JWT real assinado com `JWT_SECRET`).
 *
 * Owner: @qa
 */

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
 * Headers de autenticação para requests de teste. Combina:
 *   - `authorization: Bearer <token>` (consumido por `requireRole` que
 *      chama `jwtVerify` — o token é assinado real com `JWT_SECRET`)
 *   - `x-user-id` e `x-user-role` (consumidos por `withRLSHandler` no
 *      caminho do middleware real — bypassa `getUserFromRequestScoped`)
 *
 * IMPORTANTE: é **async** pois assina o JWT. Chamar no setup do teste:
 *
 * @example
 *   const headers = await makeAuthHeaders('user-123', 'ATHLETE');
 *   const req = new NextRequest(url, { headers });
 *
 * Para o caso síncrono (token fake) quando `requireRole` é mockado à parte,
 * usar `makeAuthHeadersSync` que apenas monta os headers x-user-*.
 */
export async function makeAuthHeaders(
  userId: string = 'user-123',
  role: string = 'ATHLETE',
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await createToken(userId, role);
  return {
    authorization: `Bearer ${token}`,
    'x-user-id': userId,
    'x-user-role': role,
    ...extra,
  };
}

/**
 * Versão síncrona de `makeAuthHeaders` — útil para testes que mockam
 * `requireRole` (ou `jose.jwtVerify`) e não precisam de um token assinado
 * real. Gera apenas os headers com `Bearer fake-token` + x-user-*.
 *
 * @example
 *   const req = new NextRequest(url, { headers: makeAuthHeadersSync('u', 'ADMIN') });
 */
export function makeAuthHeadersSync(
  userId: string = 'user-123',
  role: string = 'ATHLETE',
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    authorization: 'Bearer fake-token',
    'x-user-id': userId,
    'x-user-role': role,
    ...extra,
  };
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

/**
 * Reseta o mock de `jwtVerify`. Útil em `afterEach` quando se quer um
 *墩clean slate sem `jest.clearAllMocks()` (mais cirúrgico).
 */
export function resetJwtVerifyMock(): void {
  const mocked = jwtVerify as unknown as jest.Mock;
  mocked.mockReset();
}
