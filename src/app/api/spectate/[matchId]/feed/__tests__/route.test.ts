import { NextRequest } from 'next/server';

const mockFindUnique = jest.fn();
const mockGetUser = jest.fn();
const mockGetActor = jest.fn();
const mockHasConcession = jest.fn();
const mockGuestAuthorized = jest.fn();
const mockGetFeed = jest.fn();

jest.mock('@/lib/prisma', () => ({ prisma: { match: { findUnique: (...a: unknown[]) => mockFindUnique(...a) } } }));
jest.mock('@/lib/auth-credentials.logic', () => ({ getAccessUserFromRequest: (...a: unknown[]) => mockGetUser(...a) }));
jest.mock('@/services/accessService', () => ({ getActor: (...a: unknown[]) => mockGetActor(...a) }));
jest.mock('@/services/spectator-concession.service', () => ({
  hasActiveSpectatorConcession: (...a: unknown[]) => mockHasConcession(...a),
  isGuestSpectatorAuthorized: (...a: unknown[]) => mockGuestAuthorized(...a),
}));
jest.mock('@/services/spectator-feed.service', () => ({ getSpectatorFeed: (...a: unknown[]) => mockGetFeed(...a) }));

import { GET } from '../route';

const CLUB = 'ct-club';

/** Gestor ativo do clube CLUB (sem atleta/vínculos de seguimento). */
const gestorActor = {
  userId: 'u-gestor',
  isActive: true,
  canOperate: false,
  memberships: [{ kind: 'GESTOR', ctId: CLUB, status: 'ACTIVE' }],
  athletePlayerId: null,
  athleteCtIds: [],
  guardianOfPlayerIds: [],
  followedPlayerIds: [],
};

const ctRow = (ctId: string) => ({ playerCts: [{ ctId }] });

function matchRow(overrides: Record<string, unknown> = {}) {
  return {
    createdByUserId: 'u-outro',
    ctId: null,
    player1Id: 'p1',
    player2Id: 'p2',
    player1PartnerId: null,
    player2PartnerId: null,
    annotationSessions: [],
    player1: { playerCts: [] },
    player2: { playerCts: [] },
    player1Partner: null,
    player2Partner: null,
    ...overrides,
  };
}

const call = () =>
  GET(new NextRequest('http://localhost/api/spectate/m1/feed'), { params: Promise.resolve({ matchId: 'm1' }) });

describe('GET /api/spectate/[matchId]/feed - acesso do gestor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGuestAuthorized.mockResolvedValue(false);
    mockHasConcession.mockResolvedValue(false);
    mockGetUser.mockResolvedValue({ id: 'u-gestor' });
    mockGetActor.mockResolvedValue(gestorActor);
    mockGetFeed.mockResolvedValue({ ok: true, status: 'LIVE', rev: 'r1', view: null });
  });

  it('403 sem usuário autenticado', async () => {
    mockGetUser.mockResolvedValue(null);
    expect((await call()).status).toBe(403);
    expect(mockGetFeed).not.toHaveBeenCalled();
  });

  it('404 quando a partida não existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
  });

  it('libera o gestor quando match.ctId é o clube dele', async () => {
    mockFindUnique.mockResolvedValue(matchRow({ ctId: CLUB }));
    expect((await call()).status).toBe(200);
    expect(mockGetFeed).toHaveBeenCalledTimes(1);
  });

  it('libera o gestor quando match.ctId é nulo mas um atleta da partida pertence ao clube (PlayerCT ativo)', async () => {
    mockFindUnique.mockResolvedValue(matchRow({ ctId: null, player1: ctRow(CLUB) }));
    expect((await call()).status).toBe(200);
  });

  it('libera o gestor quando só o parceiro (duplas) pertence ao clube', async () => {
    mockFindUnique.mockResolvedValue(matchRow({ player2Partner: ctRow(CLUB) }));
    expect((await call()).status).toBe(200);
  });

  it('403 quando a partida e os atletas são de outro clube', async () => {
    mockFindUnique.mockResolvedValue(
      matchRow({ ctId: 'ct-outro', player1: ctRow('ct-outro'), player2: ctRow('ct-outro') }),
    );
    const res = await call();
    expect(res.status).toBe(403);
    expect(mockGetFeed).not.toHaveBeenCalled();
  });

  it('consulta só os vínculos ATIVOS dos atletas (status ACTIVE) e sessões de anotação ativas', async () => {
    mockFindUnique.mockResolvedValue(matchRow({ ctId: CLUB }));
    await call();
    const arg = mockFindUnique.mock.calls[0][0] as any;
    expect(arg.select.player1.select.playerCts.where).toEqual({ status: 'ACTIVE' });
    expect(arg.select.player2Partner.select.playerCts.where).toEqual({ status: 'ACTIVE' });
    expect(arg.select.annotationSessions.where).toEqual({ isActive: true });
  });

  it('mantém o acesso por concessão de espectador mesmo sem vínculo com o clube', async () => {
    mockGetActor.mockResolvedValue({ ...gestorActor, memberships: [] });
    mockHasConcession.mockResolvedValue(true);
    mockFindUnique.mockResolvedValue(matchRow());
    expect((await call()).status).toBe(200);
  });
});
