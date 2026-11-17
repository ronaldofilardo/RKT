/**
 * Split de playerService.test.ts — describe "createPlayer - birthYear":
 * idade via birthYear, categoria ESTADUAL automática (e não sobrescrita),
 * regra dos <11 anos e prevalência do age informado. Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { createPlayer } from '@/services/playerService';
import { callArgs, playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;
const currentYear = new Date().getFullYear();

describe('createPlayer - birthYear', () => {
  it('deve calcular idade a partir de birthYear quando age e birthDate não são fornecidos', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo', age: 25, birthDate: null, birthYear: currentYear - 25 }));

    await createPlayer({ name: 'Novo', birthYear: currentYear - 25 });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.age).toBe(25);
    expect(args.data.birthDate).toBeUndefined();
  });

  it('deve definir categoria ESTADUAL automática a partir do birthYear', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo', age: 14, birthDate: null, rankings: { ESTADUAL: { category: '13-14' } } }));

    await createPlayer({ name: 'Novo', birthYear: currentYear - 14 });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.age).toBe(14);
    expect(args.data.rankings).toEqual({ ESTADUAL: { category: '13-14' } });
  });

  it('não sobrescreve categoria ESTADUAL já informada', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo', age: 14, birthDate: null, rankings: { ESTADUAL: { category: '15-16' } } }));

    await createPlayer({
      name: 'Novo',
      birthYear: currentYear - 14,
      rankings: { ESTADUAL: { category: '15-16' } },
    });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.rankings).toEqual({ ESTADUAL: { category: '15-16' } });
  });

  it('não define categoria quando idade é menor que 11', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Crianca', age: 9, birthDate: null, rankings: {} }));

    await createPlayer({ name: 'Crianca', birthYear: currentYear - 9 });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.age).toBe(9);
    expect(args.data.rankings).toEqual({});
  });

  it('age fornecido prevalece sobre birthYear', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo', age: 30, birthDate: null }));

    await createPlayer({ name: 'Novo', age: 30, birthYear: currentYear - 20 });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.age).toBe(30);
  });
});
