/**
 * Split de playerService.test.ts — describe "createPlayer - birthDate":
 * cálculo de idade a partir de birthDate, payload completo com birthDate e
 * criação sem birthDate. Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { createPlayer } from '@/services/playerService';
import { callArgs, playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('createPlayer - birthDate', () => {
  it('deve calcular idade a partir de birthDate quando age não é fornecido', async () => {
    const birthDate = new Date(`${new Date().getFullYear() - 25}-03-15`);
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo', age: 25, birthDate }));

    const result = await createPlayer({ name: 'Novo', birthDate });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.age).toBe(new Date().getFullYear() - birthDate.getFullYear());
    expect(result.birthDate).toEqual(birthDate);
  });

  it('deve criar jogador com birthDate', async () => {
    const mockBirthDate = new Date('1999-03-15');
    mockPrisma.player.create.mockResolvedValue(playerRow({
      id: 'p1', name: 'Novo', gender: 'MALE', age: 25, birthDate: mockBirthDate,
      dominance: 'RIGHT', backhand: 'ONE_HANDED', ranking: 10,
      rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
    }));

    const result = await createPlayer({
      name: 'Novo', email: 'novo@test.com', gender: 'MALE', age: 25, birthDate: mockBirthDate,
      dominance: 'RIGHT', backhand: 'ONE_HANDED', ranking: 10,
      rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
    });

    expect(mockPrisma.player.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Novo', email: 'novo@test.com', gender: 'MALE', age: 25, birthDate: mockBirthDate,
        dominance: 'RIGHT', backhand: 'ONE_HANDED', ranking: 10,
        rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
      }),
      select: expect.objectContaining({
        id: true, name: true, gender: true, age: true, birthDate: true,
        dominance: true, backhand: true, ranking: true, rankings: true, club: true,
        cpfHash: true, cpfLast2: true, identityStatus: true, athleteCode: true,
        userId: true, createdByUserId: true,
      }),
    });
    expect(result.birthDate).toEqual(mockBirthDate);
  });

  it('deve criar jogador sem birthDate quando não fornecido', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Sem Data' }));

    await createPlayer({ name: 'Sem Data' });

    const args = callArgs(mockPrisma.player.create);
    expect(args.data.birthDate).toBeUndefined();
  });
});
