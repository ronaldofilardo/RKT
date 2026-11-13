jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { resolveOrCreateAnnotation } from '../match-resolve-annotation.logic';
import type { Actor } from '@/core/access/types';

const mockFindFirst = prisma.match.findFirst as jest.MockedFunction<any>;
const mockCreate = prisma.match.create as jest.MockedFunction<any>;
const mockAudit = prisma.auditLog.create as jest.MockedFunction<any>;

function makeActor(over: Partial<Actor> = {}): Actor {
  return {
    userId: 'user-1',
    isActive: true,
    canOperate: true,
    memberships: [],
    athletePlayerId: null,
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    ...over,
  };
}

const baseTemplate = {
  id: 'match-12421',
  isTemplate: true,
  isPublicTemplate: false,
  eventScope: 'PRIVATE_CLUB' as const,
  createdByUserId: 'gestor-1',
  assignedCoachId: 'coach-A',
  ctId: 'ct-1',
  player1Id: 'p1',
  player2Id: 'p2',
  player1PartnerId: null,
  player2PartnerId: null,
  matchType: 'SINGLES' as const,
  format: 'BEST_OF_3' as const,
  sportType: 'TENNIS',
  courtType: 'CLAY',
  nickname: null,
  scheduledAt: null,
  tournamentName: 'Interno',
  clubName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  details: null,
  isOfficialClubAnnotation: false,
};

describe('resolveOrCreateAnnotation (isolamento por anotador)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Treinador A designado cria anotação marcada como isOfficialClubAnnotation=true', async () => {
    mockFindFirst.mockResolvedValueOnce(baseTemplate).mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ id: 'ann-A', state: 'SCHEDULED' });

    const coachA = makeActor({
      userId: 'coach-A',
      memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
    });

    const res = await resolveOrCreateAnnotation('match-12421', coachA, 'resolve', 'ct-1');

    expect(res).toMatchObject({ matchId: 'ann-A', created: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceMatchId: 'match-12421',
          createdByUserId: 'coach-A',
          isOfficialClubAnnotation: true,
          isTemplate: false,
        }),
      }),
    );
    expect(mockAudit).toHaveBeenCalled();
  });

  it('Pai B (responsável por jogador 2 menor) cria sua própria anotação isolada com isOfficialClubAnnotation=false', async () => {
    mockFindFirst.mockResolvedValueOnce(baseTemplate).mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ id: 'ann-B', state: 'SCHEDULED' });

    const fatherB = makeActor({ userId: 'father-B', guardianOfPlayerIds: ['p2'] });

    const res = await resolveOrCreateAnnotation('match-12421', fatherB, 'resolve', null);

    expect(res).toMatchObject({ matchId: 'ann-B', created: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceMatchId: 'match-12421',
          createdByUserId: 'father-B',
          isOfficialClubAnnotation: false,
        }),
      }),
    );
  });

  it('mode=resolve retorna anotação existente de forma idempotente', async () => {
    mockFindFirst
      .mockResolvedValueOnce(baseTemplate)
      .mockResolvedValueOnce({ id: 'ann-B', state: 'IN_PROGRESS' });

    const fatherB = makeActor({ userId: 'father-B', guardianOfPlayerIds: ['p2'] });
    const res = await resolveOrCreateAnnotation('match-12421', fatherB, 'resolve');

    expect(res).toEqual({ matchId: 'ann-B', created: false, state: 'IN_PROGRESS' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('bloqueia (403) terceiro sem vínculo com o cartaz privado', async () => {
    mockFindFirst.mockResolvedValueOnce(baseTemplate);
    const outsider = makeActor({ userId: 'outsider' });

    await expect(resolveOrCreateAnnotation('match-12421', outsider, 'resolve')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('trata corrida P2002 no banco retornando a anotação já criada em mode=resolve', async () => {
    const { Prisma } = await import('@prisma/client');
    mockFindFirst
      .mockResolvedValueOnce(baseTemplate)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ann-raced', state: 'SCHEDULED' });
    mockCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.17.0',
      }),
    );

    const fatherB = makeActor({ userId: 'father-B', guardianOfPlayerIds: ['p2'] });
    const res = await resolveOrCreateAnnotation('match-12421', fatherB, 'resolve');

    expect(res).toEqual({ matchId: 'ann-raced', created: false, state: 'SCHEDULED' });
  });

  it('permite treinador designado iniciar anotação isolada em partida raiz legada (isTemplate=false)', async () => {
    const legacyAssigned = {
      ...baseTemplate,
      id: 'cmvzyocw70004pdwad5kkrj60',
      state: 'IN_PROGRESS',
      sourceMatchId: null,
      isTemplate: false,
      isPublicTemplate: false,
      eventScope: 'PRIVATE_PERSONAL' as const,
      ctId: null,
      assignedCoachId: 'coach-A',
    };
    mockFindFirst.mockResolvedValueOnce(legacyAssigned).mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ id: 'ann-coach-legacy', state: 'SCHEDULED' });

    const coachA = makeActor({ userId: 'coach-A' });
    const res = await resolveOrCreateAnnotation('cmvzyocw70004pdwad5kkrj60', coachA, 'create', 'ct-1');

    expect(res).toMatchObject({ matchId: 'ann-coach-legacy', created: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceMatchId: 'cmvzyocw70004pdwad5kkrj60',
          createdByUserId: 'coach-A',
          isOfficialClubAnnotation: true,
        }),
      }),
    );
  });

  it('bloqueia (403) terceiro não designado ao tentar resolver partida não-template privada', async () => {
    mockFindFirst.mockResolvedValueOnce({
      ...baseTemplate,
      id: 'legacy-private',
      state: 'IN_PROGRESS',
      sourceMatchId: null,
      isTemplate: false,
      isPublicTemplate: false,
      eventScope: 'PRIVATE_PERSONAL' as const,
      assignedCoachId: 'coach-A',
    });

    const outsider = makeActor({ userId: 'outsider' });
    await expect(resolveOrCreateAnnotation('legacy-private', outsider, 'resolve')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });
});

