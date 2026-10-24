import { createToken } from './auth-token';

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
