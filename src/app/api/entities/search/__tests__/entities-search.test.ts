import { prisma } from '@/lib/prisma';
import { searchEntities, decodeCursor } from '../entities-search.logic';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trainingCenter: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  },
}));

const CT_ROW = { id: 'ct-1', name: 'CT Alpha', address: { city: 'São Paulo' } };
const COACH_ROW = { id: 'u-9', name: 'Coach Beta', club: 'Clube X' };

describe('A0.21 Fase 2 — GET /api/entities/search (lógica)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('busca CTs ativos com cidade extraída do endereço', async () => {
    (prisma.trainingCenter.findMany as jest.Mock).mockResolvedValue([CT_ROW]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const page = await searchEntities({ q: 'alp', type: 'CT', limit: 10, cursor: null });

    expect(page.items).toEqual([{ id: 'ct-1', kind: 'CT', name: 'CT Alpha', detail: 'São Paulo' }]);
    expect(page.nextCursor).toBeNull();
    expect(prisma.trainingCenter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
        take: 11,
      }),
    );
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('busca apenas treinadores particulares (membership TREINADOR avulsa)', async () => {
    (prisma.trainingCenter.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([COACH_ROW]);

    const page = await searchEntities({ q: 'bet', type: 'COACH', limit: 10, cursor: null });

    expect(page.items).toEqual([{ id: 'u-9', kind: 'COACH', name: 'Coach Beta', detail: 'Clube X' }]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberships: { some: { kind: 'TREINADOR', status: 'ACTIVE', ctId: null } },
        }),
      }),
    );
    expect(prisma.trainingCenter.findMany).not.toHaveBeenCalled();
  });

  it('limita o resultado a 10 itens mesmo pedindo mais (DoD Fase 2)', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ id: `ct-${i}`, name: `CT ${i}`, address: null }));
    (prisma.trainingCenter.findMany as jest.Mock).mockResolvedValue(many);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const page = await searchEntities({ q: 'ct', type: 'ALL', limit: 99, cursor: null });

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toBeTruthy();
    expect(decodeCursor(page.nextCursor)).toEqual({ name: page.items[9].name, id: page.items[9].id });
  });

  it('emite cursor e continua a partir dele na página seguinte', async () => {
    const first = await (async () => {
      (prisma.trainingCenter.findMany as jest.Mock).mockResolvedValue([
        { id: 'ct-1', name: 'A', address: null },
        { id: 'ct-2', name: 'B', address: null },
        { id: 'ct-3', name: 'C', address: null },
      ]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      return searchEntities({ q: 'x', type: 'CT', limit: 2, cursor: null });
    })();

    expect(first.items.map((i) => i.name)).toEqual(['A', 'B']);
    expect(first.nextCursor).toBeTruthy();

    await searchEntities({ q: 'x', type: 'CT', limit: 2, cursor: decodeCursor(first.nextCursor) });
    const where = (prisma.trainingCenter.findMany as jest.Mock).mock.calls[1][0].where;
    expect(where.OR).toEqual([{ name: { gt: 'B' } }, { name: 'B', id: { gt: 'ct-2' } }]);
  });

  it('cursor inválido é ignorado (volta para a primeira página)', () => {
    expect(decodeCursor('não-é-json')).toBeNull();
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(Buffer.from('{"name":1}').toString('base64url'))).toBeNull();
  });
});
