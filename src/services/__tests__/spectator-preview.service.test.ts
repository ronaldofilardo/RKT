import { getInvitePreview } from '../spectator-preview.service';
import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchShareLink: {
      findUnique: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
    },
    consentRecord: {
      findMany: jest.fn(),
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

  it('returns preview data with anonymized codes for minors when broadcast consented', async () => {
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
        player1: { id: 'p1', name: 'Ana Souza', birthDate: new Date('2015-01-01') },
        player2: { id: 'p2', name: 'Bia Lima', birthDate: new Date('2015-01-01') },
      },
    });

    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      player1: { id: 'p1', birthDate: new Date('2015-01-01') },
      player2: { id: 'p2', birthDate: new Date('2015-01-01') },
    });
    (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'p1' },
      { playerId: 'p2' },
    ]);

    const res = await getInvitePreview('valid-token');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inviterName).toBe('Marcos');
      expect(res.matchTitle).toMatch(/^Atleta #[0-9A-F]{6} × Atleta #[0-9A-F]{6}$/);
      expect(res.courtAndSet).toBe('Quadra 2 · 2º set');
      expect(res.status).toBe('Ao vivo');
    }
  });

  it('bloqueia preview (403) quando menor não possui consentimento BROADCAST', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'l1',
      tokenHash: hashSpectateToken('valid-token'),
      matchId: 'm1',
      match: {
        id: 'm1',
        state: 'IN_PROGRESS',
        player1: { id: 'p1', name: 'Ana Souza', birthDate: new Date('2015-01-01') },
        player2: { id: 'p2', name: 'Bia Lima', birthDate: new Date('2015-01-01') },
      },
    });

    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      player1: { id: 'p1', birthDate: new Date('2015-01-01') },
      player2: { id: 'p2', birthDate: new Date('2015-01-01') },
    });
    (prisma.consentRecord.findMany as jest.Mock).mockResolvedValue([]); // sem consentimento

    const res = await getInvitePreview('valid-token');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('MINOR_BROADCAST_NOT_CONSENTED');
    if (!res.ok) {
      expect(res.status).toBe(403);
    }
  });
});

