jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('../../_logic', () => mockLogicModule());
jest.mock('@/lib/access-handler', () => mockAccessHandlerModule());

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getPrismaMock,
  mockAccessHandlerModule,
  mockLogicModule,
  mockPrismaModule,
} from './routeGestorMatchesCharacterizationTestKit';

const mockPrisma = getPrismaMock();

describe('GET /api/gestor/matches (pós-Fase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('query WHERE e cálculo de isDesignatedAnnotator + pointCount', async () => {
    const { getGestorCtId } = await import('../../_logic');
    (getGestorCtId as jest.Mock).mockResolvedValue('ct-gestor');

    mockPrisma.membership.findMany.mockResolvedValue([
      { userId: 'coach-1' },
      { userId: 'coach-2' },
    ]);
    mockPrisma.playerCT.findMany.mockResolvedValue([
      { playerId: 'player-1', player: { userId: 'athlete-1' } },
    ]);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'ann-1',
        state: 'FINISHED',
        createdByUserId: 'coach-1',
        isOfficialClubAnnotation: false,
        sourceMatch: { id: 'tpl-1', assignedCoachId: 'coach-1' },
        _count: { pointLog: 42 },
      },
      {
        id: 'ann-2',
        state: 'IN_PROGRESS',
        createdByUserId: 'parent-1',
        isOfficialClubAnnotation: false,
        sourceMatch: { id: 'tpl-1', assignedCoachId: 'coach-1' },
        _count: { pointLog: 12 },
      },
    ]);

    const { GET } = await import('../route');
    const request = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const res = await GET(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items[0].isDesignatedAnnotator).toBe(true);
    expect(json.items[0].pointCount).toBe(42);
    expect(json.items[1].isDesignatedAnnotator).toBe(false);
    expect(json.items[1].pointCount).toBe(12);
  });
});
