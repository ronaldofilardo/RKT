import { getGestorAthletesList } from '../athletes-get.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    playerCT: {
      findMany: jest.fn(),
    },
  },
}));

describe('getGestorAthletesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filtra estritamente atletas com status ACTIVE (não lista solicitações PENDING)', async () => {
    (prisma.playerCT.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pct-active',
        playerId: 'p-1',
        status: 'ACTIVE',
        player: {
          id: 'p-1',
          name: 'Atleta do Clube',
          nickname: null,
          email: null,
          birthDate: null,
          age: null,
          cpf: null,
          cpfLast2: null,
          gender: 'MALE',
          dominance: null,
          backhand: null,
          rankings: null,
          guardianGate: null,
          createdAt: new Date(),
          guardianLinks: [],
          guardianInvites: [],
          consentRecords: [],
          user: null,
        },
      },
    ]);

    const result = await getGestorAthletesList('ct-1');

    expect(prisma.playerCT.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ctId: 'ct-1', status: 'ACTIVE' },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].player.name).toBe('Atleta do Clube');
  });
});
