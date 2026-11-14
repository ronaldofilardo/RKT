import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = { player: { findMany: jest.fn() } };
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

describe('gestor-affiliates.logic', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('retorna atletas e herda localidade do CT quando não informada no atleta', async () => {
    mockPrisma.player.findMany.mockResolvedValue([
      {
        id: 'p-1', name: 'Carlos Alcaraz', nickname: 'carlitos', club: 'Clube Central',
        city: null, state: null, gender: 'MALE', age: 21, dominance: 'RIGHT',
        backhand: 'TWO_HANDED', rankings: { cbt: { position: 1 } },
        playerCts: [{ ct: { name: 'CT Morumbi', address: { cidade: 'São Paulo', estado: 'SP' } } }],
        clubRef: null,
        coachAthleteLinks: [{ coach: { name: 'Treinador Juan' } }],
      },
      {
        id: 'p-2', name: 'Atleta Avulso', nickname: null, club: null,
        city: null, state: null, gender: null, age: null, dominance: null,
        backhand: null, rankings: null, playerCts: [], clubRef: null, coachAthleteLinks: [],
      },
    ] as any);

    const { fetchAffiliateAthletes } = await import('../affiliates/gestor-affiliates.logic');
    const result = await fetchAffiliateAthletes();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'p-1', name: 'Carlos Alcaraz', nickname: 'carlitos',
      clubName: 'CT Morumbi', coachName: 'Treinador Juan',
      dominance: 'RIGHT', backhand: 'TWO_HANDED', gender: 'MALE', age: 21,
      rankings: { cbt: { position: 1 } }, city: 'São Paulo', state: 'SP',
    });
    expect((result[0] as any).cpf).toBeUndefined();
    expect(result[1].city).toBeNull();
    expect(result[1].state).toBeNull();
  });

  it('aplica filtro de busca quando termo for fornecido', async () => {
    mockPrisma.player.findMany.mockResolvedValue([] as any);
    const { fetchAffiliateAthletes } = await import('../affiliates/gestor-affiliates.logic');
    await fetchAffiliateAthletes('alcaraz');

    expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'alcaraz', mode: 'insensitive' } },
            { nickname: { contains: 'alcaraz', mode: 'insensitive' } },
            { club: { contains: 'alcaraz', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });
});
