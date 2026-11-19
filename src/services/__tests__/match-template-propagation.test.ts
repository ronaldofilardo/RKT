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

  it('propaga campos completos para SCHEDULED e apenas metadados para IN_PROGRESS', async () => {
    mockUpdateMany
      .mockResolvedValueOnce({ count: 1 }) // SCHEDULED
      .mockResolvedValueOnce({ count: 1 }); // IN_PROGRESS

    const result = await propagateTemplateUpdate('tpl-1', {
      player1Id: 'new-player-1',
      format: 'PRO_SET',
      tournamentName: 'Copa Atualizada',
      state: 'FINISHED',
    });

    expect(result.propagated).toBe(2);
    expect(result.scheduledCount).toBe(1);
    expect(result.inProgressCount).toBe(1);

    // Primeira chamada: SCHEDULED recebe tudo (jogadores, formato e metadados)
    expect(mockUpdateMany).toHaveBeenNthCalledWith(1, {
      where: {
        sourceMatchId: 'tpl-1',
        state: 'SCHEDULED',
        deletedAt: null,
      },
      data: {
        player1Id: 'new-player-1',
        format: 'PRO_SET',
        tournamentName: 'Copa Atualizada',
      },
    });

    // Segunda chamada: IN_PROGRESS recebe APENAS metadados (congelando player1Id e format)
    expect(mockUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        sourceMatchId: 'tpl-1',
        state: 'IN_PROGRESS',
        deletedAt: null,
      },
      data: {
        tournamentName: 'Copa Atualizada',
      },
    });
  });

  it('não atualiza IN_PROGRESS se apenas campos estruturais (jogadores/formato) mudaram', async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 2 }); // SCHEDULED

    const result = await propagateTemplateUpdate('tpl-1', {
      player1Id: 'new-p1',
      format: 'BEST_OF_3',
    });

    expect(result.propagated).toBe(2);
    expect(result.scheduledCount).toBe(2);
    expect(result.inProgressCount).toBe(0);

    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { sourceMatchId: 'tpl-1', state: 'SCHEDULED', deletedAt: null },
      data: { player1Id: 'new-p1', format: 'BEST_OF_3' },
    });
  });

  it('é no-op quando nenhum campo propagável mudou', async () => {
    const result = await propagateTemplateUpdate('tpl-1', { state: 'FINISHED' });

    expect(result).toEqual({ propagated: 0, scheduledCount: 0, inProgressCount: 0 });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
