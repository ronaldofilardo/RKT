/**
 * Kit de testes de matchRepository.characterization.test.ts (não é .test.ts:
 * fica fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * - prismaMock/mockPrismaModule(): factory do jest.mock('@/lib/prisma') com o
 *   mock findMany usado por todos os testes de listMatches (instância única,
 *   acessível via getPrismaMock() — os testes NÃO importam '@/lib/prisma'
 *   estaticamente, para que o mock seja registrado antes do require lazy);
 * - getPrismaMock(): a mesma instância devolvida pela factory.
 *
 * CONTRATO PÓS-FASE 4 — src/services/matchRepository.ts (listMatches)
 *
 * Valida o isolamento estrito de listagem por usuário criador:
 * - Sem createdByUserId → []
 * - Usuário comum (PARTICULAR ou CT) → OR restrito a createdByUserId + (cartazes próprios)
 * - followedPlayerIds → NÃO gera vazamento de anotações alheias
 * - Gestor (ctMemberUserIds) → vê CT + derivadas dos membros do CT + cartazes próprios
 * - assignedCoachId → inclui cartazes designados ainda sem anotação do treinador
 * - Cartazes (`isTemplate`) só entram quando criados pelo próprio usuário
 */

const prismaMock = {
  match: {
    findMany: jest.fn(),
  },
};

/** A mesma instância devolvida pela factory do jest.mock('@/lib/prisma'). */
export function getPrismaMock() {
  return prismaMock;
}

/** Factory do jest.mock('@/lib/prisma'). */
export function mockPrismaModule() {
  return { prisma: prismaMock };
}
