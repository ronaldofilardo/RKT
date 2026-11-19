jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { listAvailableTemplates } from '../match-available.logic';
import type { Actor } from '@/core/access/types';

const mockMatchFindMany = prisma.match.findMany as jest.MockedFunction<any>;

const baseActor: Actor = {
  userId: 'user-viewer',
  isActive: true,
  memberships: [],
  guardianOfPlayerIds: [],
};

describe('listAvailableTemplates - masking de menores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mascara nome de atleta menor quando visualizador não está diretamente envolvido', async () => {
    mockMatchFindMany
      .mockResolvedValueOnce([
        {
          id: 'tpl-1',
          format: 'BEST_OF_3',
          matchType: 'SINGLES',
          sportType: 'TENNIS',
          courtType: 'CLAY',
          scheduledAt: new Date(),
          tournamentName: 'Torneio Aberto',
          clubName: null,
          category: null,
          round: null,
          ctId: null,
          createdAt: new Date(),
          createdByUserId: 'creator-other',
          assignedCoachId: null,
          eventScope: 'PUBLIC',
          player1Id: 'minor-1',
          player2Id: 'adult-2',
          player1PartnerId: null,
          player2PartnerId: null,
          player1: {
            id: 'minor-1',
            name: 'Carlos Menor Real',
            nickname: 'Carlinhos',
            birthDate: new Date('2014-06-01'),
          },
          player2: {
            id: 'adult-2',
            name: 'Adulto Silva',
            nickname: 'Silva',
            birthDate: new Date('1990-01-01'),
          },
          _count: { annotations: 0 },
        },
      ])
      .mockResolvedValueOnce([]); // myAnnotations

    const result = await listAvailableTemplates(baseActor);

    expect(result).toHaveLength(1);
    const item = result[0];
    // Menor não envolvido: nome mascarado e nickname nulo
    expect(item.player1?.name).toMatch(/^Atleta #[A-Fa-f0-9]{6}$/);
    expect(item.player1?.nickname).toBeNull();
    // Adulto: nome real mantido
    expect(item.player2?.name).toBe('Adulto Silva');
  });

  it('mantém nome real quando visualizador é o guardião ou treinador vinculado', async () => {
    const involvedActor: Actor = {
      ...baseActor,
      guardianOfPlayerIds: ['minor-1'],
    };

    mockMatchFindMany
      .mockResolvedValueOnce([
        {
          id: 'tpl-2',
          format: 'BEST_OF_3',
          matchType: 'SINGLES',
          sportType: 'TENNIS',
          courtType: 'CLAY',
          scheduledAt: new Date(),
          tournamentName: 'Torneio Aberto',
          clubName: null,
          category: null,
          round: null,
          ctId: null,
          createdAt: new Date(),
          createdByUserId: 'creator-same',
          assignedCoachId: null,
          eventScope: 'PUBLIC',
          player1Id: 'minor-1',
          player2Id: 'adult-2',
          player1PartnerId: null,
          player2PartnerId: null,
          player1: {
            id: 'minor-1',
            name: 'Carlos Menor Real',
            nickname: 'Carlinhos',
            birthDate: new Date('2014-06-01'),
          },
          player2: {
            id: 'adult-2',
            name: 'Adulto Silva',
            nickname: 'Silva',
            birthDate: new Date('1990-01-01'),
          },
          _count: { annotations: 0 },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await listAvailableTemplates(involvedActor);

    expect(result).toHaveLength(1);
    expect(result[0].player1?.name).toBe('Carlos Menor Real');
    expect(result[0].player1?.nickname).toBe('Carlinhos');
  });
});
