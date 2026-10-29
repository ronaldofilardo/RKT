import { redeemShareLink, hasActiveSpectatorConcession } from '../spectator-concession.service';
import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchShareLink: { findUnique: jest.fn(), update: jest.fn() },
    matchSpectator: { findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

describe('spectator-concession.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resgata convite válido e cria concessão MatchSpectator', async () => {
    const rawToken = 'valid-token-32-chars-long-example';
    const hash = hashSpectateToken(rawToken);

    (prisma.matchShareLink.findUnique as jest.Mock).mockResolvedValue({
      id: 'l1',
      matchId: 'm1',
      tokenHash: hash,
      revokedAt: null,
      match: { id: 'm1', state: 'IN_PROGRESS', finishedAt: null, deletedAt: null },
    });
    (prisma.matchSpectator.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.matchSpectator.count as jest.Mock).mockResolvedValue(2);
    (prisma.matchSpectator.upsert as jest.Mock).mockResolvedValue({ id: 'spec-1' });
    (prisma.matchShareLink.update as jest.Mock).mockResolvedValue({});

    const res = await redeemShareLink({ token: rawToken, userId: 'user-guest' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.matchId).toBe('m1');
    }
  });

  it('rejeita token inválido ou revogado com 404 INVITE_INVALID', async () => {
    (prisma.matchShareLink.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await redeemShareLink({ token: 'unknown-token', userId: 'user-guest' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(404);
      expect(res.error).toBe('INVITE_INVALID');
    }
  });

  it('rejeita quando atingir a lotação máxima de 5 acompanhantes com 403 SPECTATOR_LIMIT', async () => {
    const rawToken = 'valid-token-32-chars-long-example';
    (prisma.matchShareLink.findUnique as jest.Mock).mockResolvedValue({
      id: 'l1',
      matchId: 'm1',
      revokedAt: null,
      match: { id: 'm1', state: 'IN_PROGRESS', finishedAt: null, deletedAt: null },
    });
    (prisma.matchSpectator.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.matchSpectator.count as jest.Mock).mockResolvedValue(5); // Lotação atingida!

    const res = await redeemShareLink({ token: rawToken, userId: 'user-guest' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(403);
      expect(res.error).toBe('SPECTATOR_LIMIT');
    }
  });

  it('hasActiveSpectatorConcession retorna true para concessão válida', async () => {
    (prisma.matchSpectator.findFirst as jest.Mock).mockResolvedValue({
      id: 'spec-1',
      match: { state: 'IN_PROGRESS', finishedAt: null },
    });

    const has = await hasActiveSpectatorConcession('m1', 'user-guest');
    expect(has).toBe(true);
  });
});

