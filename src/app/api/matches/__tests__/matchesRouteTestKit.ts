/**
 * CHARACTERIZATION TESTS — /api/matches/route.ts
 *
 * Propósito: Capturar comportamento OBSERVADO (não o "deveria ser")
 * Data: 2026-07-20
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos):
 * - TD-044: JWT_SECRET agora usa getJWTSecret() centralizado (resolved 2026-07-28)
 * - TD-043: GET com paginação cursor-based, limit cap em 100 (resolved 2026-07-28)
 *
 * NOTA (TD-029): Originalmente esta suíte fazia `fetch()` real contra um
 * servidor Next.js rodando em localhost:3000 (portanto era, na prática, um
 * teste E2E). Em 2026-07-25 foi migrada para o padrão de mock de Prisma +
 * chamada direta dos handlers `GET`/`POST` — alinhada com a suíte irmã
 * `route.test.ts`. Os comportamentos caracterizados aqui NÃO foram alterados,
 * apenas isolados de dependência de rede/DB.
 *
 * Kit compartilhado pelas suítes route.characterization.*.test.ts.
 * Fora da coleta do Jest (nao termina em .test.ts).
 */
import { NextRequest } from 'next/server';
import { makeAuthHeaders } from '@/test-helpers/auth';

export function prismaMock() {
  const txMock = {
    match: {
      create: jest.fn(),
    },
  };
  const mock = {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(txMock)),
    __txMock: txMock,
  };
  return { prisma: mock };
}

export function duplicateServiceMock() {
  return { findDuplicateMatch: jest.fn() };
}

// FIX: `RoleSchema` (src/schemas/contracts.ts) só define os papéis
// 'ADMIN' e 'ANNOTATOR' — 'ATHLETE' e 'SPECTATOR' não existem mais no
// sistema (drift: a suíte ficou presa a um modelo de roles antigo).
// `isRole()` em src/lib/auth.ts rejeita qualquer role fora de
// VALID_ROLES, então getUserFromRequestScoped() retornava null para
// esses headers e TODA rota respondia 401, mesmo em cenários que devia
// ser 200/201/403. 'ATHLETE' agora autentica como 'ANNOTATOR'
// (role que tem a permissão 'play:match', usada por POST /api/matches,
// e é o único role que a rota GET realmente consulta via listMatches),
// e 'SPECTATOR' como 'ADMIN' (autenticado, mas sem 'play:match' —
// mantém o cenário de "usuário logado sem permissão" no teste 403 do POST).
export type AuthKind = 'ATHLETE' | 'SPECTATOR';

const AUTH_SPEC: Record<AuthKind, [string, string]> = {
  ATHLETE: ['user-ath', 'ANNOTATOR'],
  SPECTATOR: ['user-spect', 'ADMIN'],
};

const headerCache: Partial<Record<AuthKind, Record<string, string>>> = {};

async function authHeaders(kind: AuthKind) {
  headerCache[kind] ??= await makeAuthHeaders(...AUTH_SPEC[kind]);
  return headerCache[kind]!;
}

export async function getMatches(url: string, auth: AuthKind | null = 'ATHLETE') {
  const req = new NextRequest(url, auth ? { headers: await authHeaders(auth) } : undefined);
  const { GET } = await import('@/app/api/matches/route');
  return GET(req);
}

export async function postMatches(body: unknown, auth: AuthKind | null = 'ATHLETE') {
  const req = new NextRequest('http://localhost:3000/api/matches', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(auth ? await authHeaders(auth) : {}) },
  });
  const { POST } = await import('@/app/api/matches/route');
  return POST(req);
}

/** Body padrão de POST /api/matches (Arrange delegado aos testes). */
export function matchCreateBody(overrides: Record<string, unknown> = {}) {
  return { player1Id: 'player-1', player2Id: 'player-2', format: 'BEST_OF_3', ...overrides };
}

/** Retorno esperado de txMock.match.create / prisma.match.create. */
export function createdMatchFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'new-match',
    format: 'BEST_OF_3',
    sportType: 'TENNIS',
    state: 'SCHEDULED',
    player1Id: 'player-1',
    player2Id: 'player-2',
    ...overrides,
  };
}
