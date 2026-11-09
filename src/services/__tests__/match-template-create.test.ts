jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findFirst: jest.fn() },
    consentRecord: { findFirst: jest.fn() },
    match: { findFirst: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import {
  createAnnotationFromTemplate,
  createPublicTemplate,
} from '../match-template-create.logic';

const mockPlayerFindFirst = prisma.player.findFirst as jest.MockedFunction<any>;
const mockConsentFindFirst = prisma.consentRecord.findFirst as jest.MockedFunction<any>;
const mockMatchFindFirst = prisma.match.findFirst as jest.MockedFunction<any>;
const mockMatchCreate = prisma.match.create as jest.MockedFunction<any>;
const mockAuditCreate = prisma.auditLog.create as jest.MockedFunction<any>;

const baseInput = {
  player1Id: 'p1',
  player2Id: 'p2',
  format: 'BEST_OF_3' as const,
  matchType: 'SINGLES' as const,
  visibility: 'PUBLIC',
  isPublicTemplate: true,
};

const template = {
  id: 'tpl-1',
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
  tournamentName: 'Copa RKT',
  clubName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  details: null,
};

describe('createPublicTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cria template público com auditoria quando o criador é adulto', async () => {
    mockPlayerFindFirst.mockResolvedValue(null);
    mockMatchCreate.mockResolvedValue({ id: 'tpl-1', format: 'BEST_OF_3', ctId: null });

    const result = await createPublicTemplate(baseInput, 'user-1');

    expect(result.id).toBe('tpl-1');
    const createArg = mockMatchCreate.mock.calls[0][0];
    expect(createArg.data.isPublicTemplate).toBe(true);
    expect(createArg.data.visibility).toBe('PUBLIC');
    expect(createArg.data.createdByUserId).toBe('user-1');
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'MATCH_TEMPLATE_CREATED' }),
      }),
    );
  });

  it('bloqueia menor sem consentimento ativo (403 CONSENT_REQUIRED)', async () => {
    mockPlayerFindFirst.mockResolvedValue({
      id: 'athlete-1',
      birthDate: new Date('2012-01-01'),
    });
    mockConsentFindFirst.mockResolvedValue(null);

    await expect(createPublicTemplate(baseInput, 'user-1')).rejects.toMatchObject({
      code: 'CONSENT_REQUIRED',
      status: 403,
    });
    expect(mockMatchCreate).not.toHaveBeenCalled();
  });

  it('permite menor com consentimento ativo', async () => {
    mockPlayerFindFirst.mockResolvedValue({
      id: 'athlete-1',
      birthDate: new Date('2012-01-01'),
    });
    mockConsentFindFirst.mockResolvedValue({ id: 'consent-1' });
    mockMatchCreate.mockResolvedValue({ id: 'tpl-2', format: 'BEST_OF_3', ctId: null });

    await expect(createPublicTemplate(baseInput, 'user-1')).resolves.toMatchObject({ id: 'tpl-2' });
  });
});

describe('createAnnotationFromTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 404 quando o template não existe ou foi encerrado', async () => {
    mockMatchFindFirst.mockResolvedValue(null);

    await expect(createAnnotationFromTemplate('tpl-x', 'user-1')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
    expect(mockMatchCreate).not.toHaveBeenCalled();
  });

  it('retorna 409 ALREADY_ANNOTATING com o id da derivada existente', async () => {
    mockMatchFindFirst
      .mockResolvedValueOnce(template)
      .mockResolvedValueOnce({ id: 'derived-existing' });

    await expect(createAnnotationFromTemplate('tpl-1', 'user-1')).rejects.toMatchObject({
      name: 'ConflictError',
      details: { code: 'ALREADY_ANNOTATING', matchId: 'derived-existing' },
    });
    expect(mockMatchCreate).not.toHaveBeenCalled();
  });

  it('cria anotação soberana privada apontando para o template', async () => {
    mockMatchFindFirst.mockResolvedValueOnce(template).mockResolvedValueOnce(null);
    mockMatchCreate.mockResolvedValue({ id: 'derived-1' });

    const result = await createAnnotationFromTemplate('tpl-1', 'user-9', 'ct-1');

    expect(result.id).toBe('derived-1');
    const createArg = mockMatchCreate.mock.calls[0][0];
    expect(createArg.data).toMatchObject({
      sourceMatchId: 'tpl-1',
      createdByUserId: 'user-9',
      visibility: 'PLAYERS_ONLY',
      state: 'SCHEDULED',
      ctId: 'ct-1',
      tournamentName: 'Copa RKT',
    });
    expect(createArg.data.isPublicTemplate).toBe(false);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'MATCH_ANNOTATION_CREATED',
          meta: { sourceMatchId: 'tpl-1' },
        }),
      }),
    );
  });

  it('lança ApiError tipado para uso em rotas', () => {
    expect(new ApiError('X', {}, 400, 'm')).toBeInstanceOf(ApiError);
  });
});
