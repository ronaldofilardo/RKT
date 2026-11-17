/**
 * Kit de teste compartilhado pelos arquivos playerService.*.test.ts.
 * Fora da coleta do Jest (nao termina em .test.ts).
 *
 * - createPrismaMock(): retorno do factory `jest.mock('@/lib/prisma', ...)`
 *   (mesmo padrão do matchServiceTestKit);
 * - playerRow(): linha de jogador com os campos nulos padrão do arquivo original;
 * - callArgs(): `mock.mock.calls[0][0]` dos testes de payload.
 */

export function createPrismaMock() {
  return {
    prisma: {
      player: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      match: {
        groupBy: jest.fn(),
      },
    },
  };
}

/** Linha de jogador nos nulos padrão; `overrides` é aplicado por último. */
export function playerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Novo',
    gender: null,
    age: null,
    birthDate: null,
    dominance: null,
    backhand: null,
    ranking: null,
    rankings: null,
    ...overrides,
  };
}

/** Primeiro argumento da primeira chamada do mock (payload enviado ao Prisma). */
export function callArgs(mock: jest.Mock) {
  return mock.mock.calls[0][0];
}
