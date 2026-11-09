jest.mock('@/lib/prisma', () => ({
  prisma: { match: { updateMany: jest.fn() } },
}));

import { prisma } from '@/lib/prisma';
import {
  PROPAGABLE_FIELDS,
  pickPropagableFields,
  propagateTemplateUpdate,
} from '../match-template-propagation.logic';

const mockUpdateMany = prisma.match.updateMany as jest.MockedFunction<any>;

describe('PROPAGABLE_FIELDS', () => {
  it('não propaga campos soberanos ou de ciclo de vida', () => {
    for (const field of ['createdByUserId', 'ctId', 'isPublicTemplate', 'state', 'scoreState', 'winnerId', 'startedAt', 'finishedAt', 'deletedAt']) {
      expect(PROPAGABLE_FIELDS as readonly string[]).not.toContain(field);
    }
  });

  it('propaga metadados do cartaz', () => {
    for (const field of ['player1Id', 'scheduledAt', 'tournamentName', 'venueClubId', 'details']) {
      expect(PROPAGABLE_FIELDS as readonly string[]).toContain(field);
    }
  });
});

describe('pickPropagableFields', () => {
  it('mantém somente campos propagáveis presentes', () => {
    const picked = pickPropagableFields({
      tournamentName: 'Copa',
      courtType: 'CLAY',
      state: 'FINISHED',
      scoreState: { sets: [] },
      unknownField: 1,
    });

    expect(picked).toEqual({ tournamentName: 'Copa', courtType: 'CLAY' });
  });

  it('não inventa campos ausentes', () => {
    expect(pickPropagableFields({ details: 'novo' })).toEqual({ details: 'novo' });
  });
});

describe('propagateTemplateUpdate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('atualiza apenas derivadas SCHEDULED/IN_PROGRESS não excluídas', async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 });

    const result = await propagateTemplateUpdate('tpl-1', {
      tournamentName: 'Copa',
      state: 'FINISHED',
    });

    expect(result).toEqual({ propagated: 2 });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        sourceMatchId: 'tpl-1',
        state: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      data: { tournamentName: 'Copa' },
    });
  });

  it('é no-op quando nenhum campo propagável mudou', async () => {
    const result = await propagateTemplateUpdate('tpl-1', { state: 'FINISHED' });

    expect(result).toEqual({ propagated: 0 });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
