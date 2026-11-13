jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: { findMany: jest.fn() },
    membership: { findMany: jest.fn() },
    playerCT: { findMany: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { listMatches, loadCtMemberUserIds } from '../matchRepository';

const mockFindMany = prisma.match.findMany as jest.MockedFunction<any>;
const mockMembershipFindMany = prisma.membership.findMany as jest.MockedFunction<any>;
const mockPlayerCTFindMany = prisma.playerCT.findMany as jest.MockedFunction<any>;

const lastWhere = () => mockFindMany.mock.calls[0][0].where;

describe('listMatches — escopo por perfil', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ADMIN/SUPORTE (unrestricted) não restringe criador nem CT e oculta templates', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'admin-1', null, null, { unrestricted: true });

    expect(lastWhere()).toEqual({ deletedAt: null, isPublicTemplate: false, isTemplate: false });
  });

  it('gestor vê o CT e as derivadas anotadas por membros do CT', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'gestor-1', 'ct-1', null, {
      ctMemberUserIds: ['u-coach', 'u-athlete'],
    });

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { ctId: 'ct-1', isPublicTemplate: false, isTemplate: false },
        {
          sourceMatchId: { not: null },
          createdByUserId: { in: ['u-coach', 'u-athlete'] },
          isPublicTemplate: false,
          isTemplate: false,
        },
        // Somente cartazes criados pelo próprio gestor.
        { isTemplate: true, createdByUserId: 'gestor-1', ctId: 'ct-1' },
      ],
    });
  });

  it('anotador/treinador mantém o escopo próprio e oculta templates alheios', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'user-1', null, null, { ctMemberUserIds: [] });

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { createdByUserId: 'user-1', isPublicTemplate: false, isTemplate: false },
        { isTemplate: true, createdByUserId: 'user-1' },
      ],
    });
  });

  it('sem scope preserva isolamento estrito por criador e oculta templates alheios', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'user-1');

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { createdByUserId: 'user-1', isPublicTemplate: false, isTemplate: false },
        { isTemplate: true, createdByUserId: 'user-1' },
      ],
    });
  });

  it('nenhuma condição do OR pode listar partida de anotador alheio', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'user-1', 'ct-1', null, {
      ctMemberUserIds: ['u-coach'],
      unrestricted: false,
    });

    const or = (lastWhere() as { OR: Array<Record<string, unknown>> }).OR;
    expect(or.length).toBeGreaterThan(0);
    for (const cond of or) {
      const isOwnCreation = cond.createdByUserId === 'user-1';
      const isCtScope = cond.ctId === 'ct-1';
      const isCtMemberDerivative =
        cond.sourceMatchId !== undefined && JSON.stringify(cond.createdByUserId).includes('u-coach');
      expect(isOwnCreation || isCtScope || isCtMemberDerivative).toBe(true);
    }
  });

  it('TREINADOR_CLUBE (sem escopo de gestor) lista só as próprias + cartazes + designadas', async () => {
    mockFindMany.mockResolvedValue([]);

    // Mesma chamada real de GET /api/matches para um treinador do CT.
    await listMatches(null, null, 20, 'coach-1', 'ct-1', null, { ctMemberUserIds: [] }, 'coach-1');

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { ctId: 'ct-1', createdByUserId: 'coach-1', isPublicTemplate: false, isTemplate: false },
        { isTemplate: true, createdByUserId: 'coach-1', ctId: 'ct-1' },
        {
          assignedCoachId: 'coach-1',
          annotations: { none: { createdByUserId: 'coach-1', deletedAt: null, state: { not: 'CANCELLED' } } },
        },
      ],
    });
  });

  it('GESTOR (ctMemberUserIds) amplia para derivadas dos membros; TREINADOR_CLUBE não', async () => {
    mockFindMany.mockResolvedValue([]);
    await listMatches(null, null, 20, 'gestor-1', 'ct-1', null, { ctMemberUserIds: ['u-athlete'] });
    const gestorOr = (lastWhere() as { OR: Array<Record<string, unknown>> }).OR;

    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    await listMatches(null, null, 20, 'coach-1', 'ct-1', null, { ctMemberUserIds: [] }, 'coach-1');
    const treinadorOr = (lastWhere() as { OR: Array<Record<string, unknown>> }).OR;

    const membros = gestorOr.find((c) => c.sourceMatchId !== undefined);
    expect(membros).toBeDefined();
    expect(treinadorOr).not.toContainEqual(membros);
  });

  it('atleta participante lista cartazes do círculo onde é participante enquanto não tiver anotação ativa', async () => {
    mockFindMany.mockResolvedValue([]);
    await listMatches(null, null, 20, 'athlete-user-1', null, null, null, null, 'p-athlete-1');

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { createdByUserId: 'athlete-user-1', isPublicTemplate: false, isTemplate: false },
        { isTemplate: true, createdByUserId: 'athlete-user-1' },
        {
          isTemplate: true,
          createdByUserId: { not: 'athlete-user-1' },
          eventScope: { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] },
          annotations: {
            none: { createdByUserId: 'athlete-user-1', deletedAt: null, state: { not: 'CANCELLED' } },
          },
          OR: [
            { player1Id: { in: ['p-athlete-1'] } },
            { player2Id: { in: ['p-athlete-1'] } },
            { player1PartnerId: { in: ['p-athlete-1'] } },
            { player2PartnerId: { in: ['p-athlete-1'] } },
          ],
        },
      ],
    });
  });

  it('treinador particular lista cartazes do círculo com atleta que acompanha enquanto não tiver anotação ativa', async () => {
    mockFindMany.mockResolvedValue([]);
    await listMatches(null, null, 20, 'coach-b-user', null, ['p-athlete-y']);

    expect(lastWhere()).toEqual({
      deletedAt: null,
      OR: [
        { createdByUserId: 'coach-b-user', isPublicTemplate: false, isTemplate: false },
        { isTemplate: true, createdByUserId: 'coach-b-user' },
        {
          isTemplate: true,
          createdByUserId: { not: 'coach-b-user' },
          eventScope: { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] },
          annotations: {
            none: { createdByUserId: 'coach-b-user', deletedAt: null, state: { not: 'CANCELLED' } },
          },
          OR: [
            { player1Id: { in: ['p-athlete-y'] } },
            { player2Id: { in: ['p-athlete-y'] } },
            { player1PartnerId: { in: ['p-athlete-y'] } },
            { player2PartnerId: { in: ['p-athlete-y'] } },
          ],
        },
      ],
    });
  });
});

describe('loadCtMemberUserIds', () => {
  beforeEach(() => jest.clearAllMocks());

  it('une membros ativos e atletas vinculados, sem duplicatas', async () => {
    mockMembershipFindMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
    mockPlayerCTFindMany.mockResolvedValue([
      { player: { userId: 'u2' } },
      { player: { userId: 'u3' } },
      { player: { userId: null } },
    ]);

    await expect(loadCtMemberUserIds('ct-1')).resolves.toEqual(['u1', 'u2', 'u3']);
  });
});
