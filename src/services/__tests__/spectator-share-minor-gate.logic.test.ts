import { canShareMatchWithMinors } from '../spectator-share-minor-gate.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: { findUnique: jest.fn() },
    consentRecord: { findMany: jest.fn() },
  },
}));

describe('canShareMatchWithMinors', () => {
  const now = new Date('2026-11-15T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite compartilhamento quando não há atletas menores na partida', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      player1: { id: 'p-adult-1', birthDate: new Date('1990-01-01') },
      player2: { id: 'p-adult-2', birthDate: new Date('1995-05-05') },
    });

    const allowed = await canShareMatchWithMinors('m1', now);
    expect(allowed).toBe(true);
    expect(prisma.consentRecord.findMany).not.toHaveBeenCalled();
  });

  it('permite compartilhamento quando todos os menores possuem consentimento BROADCAST ativo', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      player1: { id: 'p-minor-1', birthDate: new Date('2015-01-01') },
      player2: { id: 'p-adult', birthDate: new Date('1990-01-01') },
    });
    (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([{ playerId: 'p-minor-1' }]);

    const allowed = await canShareMatchWithMinors('m1', now);
    expect(allowed).toBe(true);
  });

  it('bloqueia compartilhamento quando algum menor não possui consentimento BROADCAST', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      player1: { id: 'p-minor-1', birthDate: new Date('2015-01-01') },
      player2: { id: 'p-minor-2', birthDate: new Date('2016-01-01') },
    });
    (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([{ playerId: 'p-minor-1' }]); // minor-2 ausente

    const allowed = await canShareMatchWithMinors('m1', now);
    expect(allowed).toBe(false);
  });
});
