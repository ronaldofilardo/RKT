import { getInvitePreview } from '../spectator-preview.service';
import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchShareLink: {
      findUnique: jest.fn(),
    },
  },
}));

describe('spectator-preview.service', () => {
  const mockFindUnique = prisma.matchShareLink.findUnique as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when link does not exist or is revoked', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await getInvitePreview('invalid-token');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('INVITE_INVALID');
  });

  it('returns 410 when match finished more than 7 days ago', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86_400_000);
    mockFindUnique.mockResolvedValue({
      id: 'l1',
      tokenHash: hashSpectateToken('expired-token'),
      matchId: 'm1',
      match: {
        id: 'm1',
        state: 'FINISHED',
        finishedAt: eightDaysAgo,
        player1: { name: 'Player 1' },
        player2: { name: 'Player 2' },
      },
    });

    const res = await getInvitePreview('expired-token');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('ACCESS_EXPIRED');
  });

  it('returns preview data with formatted names and court info', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'l1',
      tokenHash: hashSpectateToken('valid-token'),
      matchId: 'm1',
      label: 'Pai da Ana',
      createdByUser: { name: 'Marcos' },
      match: {
        id: 'm1',
        state: 'IN_PROGRESS',
        courtType: '2',
        scoreState: { sets: [{ player1: 6, player2: 4 }] },
        player1: { name: 'Ana Souza', birthDate: new Date('2015-01-01') }, // minor -> Ana S.
        player2: { name: 'Bia Lima', birthDate: new Date('2015-01-01') },  // minor -> Bia L.
      },
    });

    const res = await getInvitePreview('valid-token');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inviterName).toBe('Marcos');
      expect(res.matchTitle).toBe('Ana S. × Bia L.');
      expect(res.courtAndSet).toBe('Quadra 2 · 2º set');
      expect(res.status).toBe('Ao vivo');
    }
  });
});

