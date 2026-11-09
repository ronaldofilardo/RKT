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

    expect(lastWhere()).toEqual({ deletedAt: null, isPublicTemplate: false });
  });

  it('gestor vê o CT e as derivadas anotadas por membros do CT', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'gestor-1', 'ct-1', null, {
      ctMemberUserIds: ['u-coach', 'u-athlete'],
    });

    expect(lastWhere()).toEqual({
      deletedAt: null,
      isPublicTemplate: false,
      OR: [
        { ctId: 'ct-1' },
        {
          sourceMatchId: { not: null },
          createdByUserId: { in: ['u-coach', 'u-athlete'] },
        },
      ],
    });
  });

  it('anotador/treinador mantém o escopo próprio e oculta templates', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'user-1', null, null, { ctMemberUserIds: [] });

    expect(lastWhere()).toEqual({
      deletedAt: null,
      isPublicTemplate: false,
      createdByUserId: 'user-1',
    });
  });

  it('sem scope preserva o comportamento legado (sem filtro de template)', async () => {
    mockFindMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'user-1');

    expect(lastWhere()).toEqual({ deletedAt: null, createdByUserId: 'user-1' });
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
