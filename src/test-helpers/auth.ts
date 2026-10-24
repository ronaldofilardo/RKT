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

export {
  createToken,
  mockJwtVerify,
} from './auth-token';

export {
  makeAuthHeaders,
  makeAuthHeadersSync,
} from './auth-headers';
