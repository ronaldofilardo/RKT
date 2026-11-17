jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('../../_logic', () => mockLogicModule());
jest.mock('@/lib/access-handler', () => mockAccessHandlerModule());

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  mockAccessHandlerModule,
  mockLogicModule,
  mockPrismaModule,
} from './routeGestorMatchesCharacterizationTestKit';

describe('GET /api/gestor/matches (pós-Fase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nega quando gestor não encontrado', async () => {
    const { getGestorCtId, denyGestor } = await import('../../_logic');
    (getGestorCtId as jest.Mock).mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    await GET(request);
    expect(denyGestor).toHaveBeenCalledWith('Gestor não encontrado');
  });
});
