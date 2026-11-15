jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { createMatchInput, resolveCreateWithInputData } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.createMatch', () => {
  it('deve criar partida com state SCHEDULED por padrão', async () => {
    const { createMatch } = await import('@/services/matchService');

    mockPrisma.match.create.mockImplementation(resolveCreateWithInputData);

    await createMatch(createMatchInput() as any);

    expect(mockPrisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'SCHEDULED',
          category: null,
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
        }),
      }),
    );
  });

  it.each([
    ['sportType TENNIS (default)', {}, 'sportType', 'TENNIS'],
    ['sportType customizado', { sportType: 'PICKLEBALL' }, 'sportType', 'PICKLEBALL'],
    ['courtType customizado', { courtType: 'CLAY' }, 'courtType', 'CLAY'],
    ['visibility customizada', { visibility: 'PRIVATE' }, 'visibility', 'PRIVATE'],
    ['openForAnnotation=true', { openForAnnotation: true }, 'openForAnnotation', true],
    ['scheduledAt', { scheduledAt: '2024-12-25T14:00:00Z' }, 'scheduledAt', '2024-12-25T14:00:00Z'],
    ['category INFANTIL', { category: 'INFANTIL' }, 'category', 'INFANTIL'],
    ['category VETERANO', { category: 'VETERANO' }, 'category', 'VETERANO'],
  ])('deve criar partida com %s', async (_label, overrides, field, expected) => {
    const { createMatch } = await import('@/services/matchService');

    mockPrisma.match.create.mockImplementation(resolveCreateWithInputData);

    await createMatch(createMatchInput(overrides) as any);

    const call = mockPrisma.match.create.mock.calls[0][0];
    expect(call.data[field]).toBe(expected);
  });
});
