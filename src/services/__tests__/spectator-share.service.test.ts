import { createShareLink, listShareLinks, revokeShareLink } from '../spectator-share.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: { findUnique: jest.fn() },
    matchAnnotationSession: { findFirst: jest.fn() },
    matchShareLink: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    matchSpectator: { findMany: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

describe('spectator-share.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite que o criador da partida gere um link de convite', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ createdByUserId: 'user-creator' });
    (prisma.matchShareLink.create as jest.Mock).mockResolvedValue({
      id: 'link-1',
      label: 'Pai do João',
      createdAt: new Date('2026-10-29T12:00:00Z'),
    });

    const res = await createShareLink({
      matchId: 'm1',
      userId: 'user-creator',
      label: 'Pai do João',
      origin: 'https://rkt.app',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.linkId).toBe('link-1');
      expect(res.url).toContain('https://rkt.app/matches/convite/');
      expect(res.label).toBe('Pai do João');
    }
  });

  it('nega geração de link para usuário sem vínculo de criador ou anotador ativo', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ createdByUserId: 'other-user' });
    (prisma.matchAnnotationSession.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await createShareLink({
      matchId: 'm1',
      userId: 'intruder',
      origin: 'https://rkt.app',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe('FORBIDDEN');
    }
  });

  it('revoga o convite e suas concessões em transação', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ createdByUserId: 'user-creator' });
    (prisma.matchShareLink.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.matchSpectator.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    const res = await revokeShareLink({ matchId: 'm1', linkId: 'link-1', userId: 'user-creator' });
    expect(res.ok).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

