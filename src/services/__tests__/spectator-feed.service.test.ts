import { getSpectatorFeed } from '../spectator-feed.service';
import { getFeedAggregation, computeFeedFingerprint } from '../spectator-feed.fingerprint';
import { buildFullSpectatorView } from '../spectator-feed.builder';

jest.mock('../spectator-feed.fingerprint');
jest.mock('../spectator-feed.builder');

describe('spectator-feed.service', () => {
  const mockAgg = {
    match: { id: 'm1', state: 'IN_PROGRESS', version: 5, updatedAt: new Date('2026-10-29T12:00:00Z') },
    pointCount: 12,
    maxSeq: 12,
    maxPtUpdMs: 1700000000000,
    lastReceivedAt: new Date('2026-10-29T12:05:00Z'),
    lastHeartbeatAt: new Date('2026-10-29T12:05:10Z'),
    annotatorName: 'Maria Silva',
    hasActiveSession: true,
    scoreEditCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna payload sem carregar view quando clientRev == rev atual (Passo 0 barato)', async () => {
    (getFeedAggregation as jest.Mock).mockResolvedValue(mockAgg);
    (computeFeedFingerprint as jest.Mock).mockReturnValue('rev-hash-123');

    const res = await getSpectatorFeed({ matchId: 'm1', clientRev: 'rev-hash-123' });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.rev).toBe('rev-hash-123');
      expect(res.view).toBeUndefined(); // Zero linhas de pontos carregadas!
      expect(res.signal.lastSignalAt).not.toBeNull();
      expect(buildFullSpectatorView).not.toHaveBeenCalled();
    }
  });

  it('carrega view completa quando clientRev difere da rev atual', async () => {
    (getFeedAggregation as jest.Mock).mockResolvedValue(mockAgg);
    (computeFeedFingerprint as jest.Mock).mockReturnValue('rev-hash-456');
    (buildFullSpectatorView as jest.Mock).mockResolvedValue({
      match: { id: 'm1', state: 'IN_PROGRESS' },
      score: { sets: [] },
      points: [],
      markers: [],
    });

    const res = await getSpectatorFeed({ matchId: 'm1', clientRev: 'old-rev' });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.rev).toBe('rev-hash-456');
      expect(res.view).toBeDefined();
      expect(buildFullSpectatorView).toHaveBeenCalled();
    }
  });
});

