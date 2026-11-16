import { getGuardianDependents } from '../dependents-read.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianLink: { findMany: jest.fn() },
    consentRecord: { findMany: jest.fn() },
  },
}));

describe('getGuardianDependents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista vazia quando o usuário não possui dependentes', async () => {
    (prisma.guardianLink.findMany as jest.Mock).mockResolvedValue([]);
    const res = await getGuardianDependents('u1');
    expect(res).toEqual([]);
    expect(prisma.consentRecord.findMany).not.toHaveBeenCalled();
  });

  it('retorna dependentes com status de consentimento agrupados', async () => {
    (prisma.guardianLink.findMany as jest.Mock).mockResolvedValue([
      {
        playerId: 'p1',
        relation: 'PAI',
        player: {
          id: 'p1',
          name: 'Eduardo Silva',
          nickname: 'Edu',
          birthDate: new Date('2012-05-10'),
          playerCts: [{ ct: { id: 'ct1', name: 'CT Tenis Brasil' } }],
        },
      },
    ]);

    (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'p1', purpose: 'DATA' },
      { playerId: 'p1', purpose: 'STATS' },
    ]);

    const res = await getGuardianDependents('u1');
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Eduardo Silva');
    expect(res[0].relation).toBe('PAI');
    expect(res[0].trainingCenterName).toBe('CT Tenis Brasil');
    expect(res[0].consents).toEqual({
      DATA: true,
      BROADCAST: false,
      STATS: true,
    });
  });
});
