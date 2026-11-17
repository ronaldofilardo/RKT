/**
 * Kit de testes de point-permissions.characterization.test.ts (não é .test.ts:
 * fica fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * - mockPrismaModule(): factory do jest.mock('@/lib/prisma');
 * - baseMatch: linha de partida usada idêntica nos dois describes do original.
 *
 * CONTRATO PÓS-FASE 4 — Permissões de ponto, estado e sessões
 *
 * Valida que apenas o anotador dono da anotação (`createdByUserId === currentUserId`)
 * e nunca em cartazes (`isTemplate: true`) pode registrar pontos ou modificar estado.
 */

export function mockPrismaModule() {
  return {
    prisma: {
      matchAnnotationSession: {
        findFirst: jest.fn(),
      },
    },
  };
}

export const baseMatch = {
  player1Id: 'p1',
  player2Id: 'p2',
  player1PartnerId: null,
  player2PartnerId: null,
  createdByUserId: 'creator',
  openForAnnotation: false,
  isTemplate: false,
};
