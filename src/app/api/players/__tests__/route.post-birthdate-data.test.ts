jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { createdPlayerWithBirth, defaultActor, postPlayers } from './playersRouteTestKit';

const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - birthDate validation - dados', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
    mockCreatePlayer.mockResolvedValue(createdPlayerWithBirth());
  });

  it('deve passar birthDate para createPlayer sem calcular idade', async () => {
    const res = await postPlayers({ name: 'Test', birthDate: '1999-01-01' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', birthDate: expect.any(Date) }),
    );
  });

  it('deve usar age fornecido mesmo se birthDate estiver presente', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayerWithBirth({ age: 30 }));

    const res = await postPlayers({ name: 'Test', age: 30, birthDate: '1999-01-01' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ age: 30 }),
    );
  });

  it('deve passar birthDate para createPlayer', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayerWithBirth({ birthDate: new Date('1999-03-15') }));

    const res = await postPlayers({ name: 'Test', birthDate: '1999-03-15' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ birthDate: expect.any(Date) }),
    );
    const callArgs = mockCreatePlayer.mock.calls[0][0];
    expect(callArgs.birthDate).toEqual(new Date('1999-03-15'));
  });

  it('deve passar birthYear para createPlayer e aceitar somente ano de nascimento', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      gender: null,
      age: null,
      birthDate: null,
      birthYear: 2010,
      dominance: null,
      backhand: null,
      ranking: null,
      rankings: {},
    });

    const res = await postPlayers({ name: 'Test', birthYear: 2010 });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', birthYear: 2010 }),
    );
  });
});
