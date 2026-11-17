/**
 * Kit de testes de route.characterization.test.ts (GET /api/gestor/matches).
 * Não é .test.ts: fica fora da coleta do Jest e não é limitado a 80L.
 * Concentra as factories dos jest.mock:
 * - mockPrismaModule(): prisma com membership/playerCT/match (instância
 *   única, acessível via getPrismaMock() — os testes NÃO importam
 *   '@/lib/prisma' estaticamente, para que o mock seja registrado antes do
 *   require lazy feito pelo route);
 * - mockLogicModule(): getGestorCtId + denyGestor do ../../_logic;
 * - mockAccessHandlerModule(): withAccessHandler que repassa user/actor fixos.
 *
 * CONTRATO PÓS-FASE 5 — GET /api/gestor/matches
 * - Inclui cartazes e anotações do CT, de membros/atletas do CT e derivadas de PRIVATE_CLUB do CT.
 * - Retorna pointCount e isDesignatedAnnotator para diferenciar o treinador designado.
 */

const prismaMock = {
  membership: { findMany: jest.fn() },
  playerCT: { findMany: jest.fn() },
  match: { findMany: jest.fn() },
};

/** A mesma instância devolvida pela factory do jest.mock('@/lib/prisma'). */
export function getPrismaMock() {
  return prismaMock;
}

/** Factory do jest.mock('@/lib/prisma'). */
export function mockPrismaModule() {
  return { prisma: prismaMock };
}

/** Factory do jest.mock('../../_logic'). */
export function mockLogicModule() {
  return {
    getGestorCtId: jest.fn(),
    denyGestor: jest.fn(() => ({ status: 403 })),
  };
}

/** Factory do jest.mock('@/lib/access-handler'). */
export function mockAccessHandlerModule() {
  return {
    withAccessHandler: jest.fn(async (_req: unknown, _action: unknown, _res: unknown, handler: any) => {
      return handler({
        user: { id: 'gestor-1', name: 'Gestor', role: 'GESTOR' },
        actor: { userId: 'gestor-1', isActive: true, canOperate: true, memberships: [] },
      });
    }),
  };
}
